const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const crypto = require('crypto');
const { pathToFileURL } = require('url');

const DEFAULT_PORT = 3001;
const MAX_PORT_ATTEMPTS = 3;
const MAX_LOG_BYTES = 5 * 1024 * 1024;

let dataDir = null;
let logPath = null;
let backendWindow = null;
let activeChild = null;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(line);
  try {
    if (logPath) fs.appendFileSync(logPath, line + '\n');
  } catch {}
}

function appPath(rel) {
  return app.isPackaged ? path.join(__dirname, rel) : path.join(__dirname, '..', rel);
}

function backendDir() {
  return appPath('backend');
}

function frontendDir() {
  return app.isPackaged
    ? path.join(__dirname, 'frontend')
    : path.join(__dirname, '..', 'frontend', 'dist');
}

function seedImagesDir() {
  return appPath('uploads/productos');
}

function prismaCliPath() {
  return path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');
}

function resolveQueryEngine() {
  const enginesDir = path.join(__dirname, 'node_modules', '@prisma', 'engines');
  try {
    const files = fs.readdirSync(enginesDir);
    const engine = files.find(
      (f) => f.startsWith('query_engine') && (f.endsWith('.node') || f.endsWith('.dll.node')),
    );
    return engine ? path.join(enginesDir, engine) : null;
  } catch {
    return null;
  }
}

function resolveSchemaEngine() {
  const candidates = [path.join(__dirname, 'node_modules', '@prisma', 'engines')];
  if (process.resourcesPath) {
    candidates.unshift(
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '@prisma', 'engines'),
    );
  }
  for (const enginesDir of candidates) {
    try {
      const files = fs.readdirSync(enginesDir);
      const engine = files.find((f) => f.startsWith('schema-engine'));
      if (engine) return path.join(enginesDir, engine);
    } catch {}
  }
  return null;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort(start) {
  for (let p = start; p < start + MAX_PORT_ATTEMPTS; p++) {
    if (await isPortFree(p)) return p;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Directorio de datos
// ---------------------------------------------------------------------------

function resolveDataDir() {
  if (process.env.CAFE_PANDORA_DEV_DATA_DIR) {
    return path.resolve(process.env.CAFE_PANDORA_DEV_DATA_DIR);
  }
  return app.getPath('userData');
}

function setupLogging() {
  fs.mkdirSync(path.join(dataDir, 'logs'), { recursive: true });
  logPath = path.join(dataDir, 'logs', 'main.log');
  try {
    const stat = fs.statSync(logPath);
    if (stat.size > MAX_LOG_BYTES) {
      fs.renameSync(logPath, path.join(dataDir, 'logs', 'main.log.1'));
    }
  } catch {}
}

function loadOrCreateSecrets() {
  const cfgPath = path.join(dataDir, 'config.json');
  let cfg = {};
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  } catch {}
  if (!cfg.jwtSecret || !cfg.jwtRefreshSecret) {
    cfg.jwtSecret = crypto.randomBytes(32).toString('hex');
    cfg.jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), { mode: 0o600 });
    log('[config] secrets JWT generados');
  }
  return cfg;
}

// ---------------------------------------------------------------------------
// Preparacion de la base de datos
// ---------------------------------------------------------------------------

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const from = path.join(src, entry);
    const to = path.join(dest, entry);
    const stat = fs.statSync(from);
    if (stat.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function stageMigrations() {
  const srcSchema = path.join(backendDir(), 'prisma', 'schema.prisma');
  const srcMigrations = path.join(backendDir(), 'prisma', 'migrations');
  const dest = path.join(dataDir, 'prisma');
  copyDir(srcMigrations, path.join(dest, 'migrations'));
  fs.copyFileSync(srcSchema, path.join(dest, 'schema.prisma'));
  return path.join(dest, 'schema.prisma');
}

function runNodeScript(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', ...extraEnv },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    activeChild = child;
    child.stdout.on('data', (d) => log('[prisma]', d.toString().trimEnd()));
    child.stderr.on('data', (d) => log('[prisma]', d.toString().trimEnd()));
    child.on('error', (err) => {
      activeChild = null;
      reject(err);
    });
    child.on('close', (code) => {
      activeChild = null;
      if (code === 0) resolve();
      else reject(new Error(`prisma terminó con código ${code}`));
    });
  });
}

async function runMigrate(dbPath) {
  const schema = stageMigrations();
  const engine = resolveQueryEngine();
  const schemaEngine = resolveSchemaEngine();
  log('[migrate] aplicando migraciones...');
  await runNodeScript([prismaCliPath(), 'migrate', 'deploy', '--schema', schema], {
    DATABASE_URL: `file:${dbPath}`,
    ...(engine ? { PRISMA_QUERY_ENGINE_LIBRARY: engine } : {}),
    ...(schemaEngine ? { PRISMA_SCHEMA_ENGINE_BINARY: schemaEngine } : {}),
  });
  log('[migrate] migraciones aplicadas');
}

function ensureSeedImages() {
  const target = path.join(dataDir, 'uploads', 'productos');
  const src = seedImagesDir();
  if (!fs.existsSync(target) || fs.readdirSync(target).length === 0) {
    if (fs.existsSync(src)) {
      fs.mkdirSync(target, { recursive: true });
      copyDir(src, target);
      log(`[imagenes] ${fs.readdirSync(target).length} imágenes seed copiadas`);
    } else {
      log('[imagenes] no se encontró el directorio de imágenes seed');
    }
  }
}

async function runSeed() {
  log('[seed] sembrando catálogo...');
  const seedUrl = pathToFileURL(path.join(backendDir(), 'prisma', 'seed.js')).href;
  const mod = await import(seedUrl);
  if (typeof mod.seed === 'function') {
    await mod.seed();
  }
  log('[seed] catálogo listo');
}

async function updateServerPortInDb(port) {
  const dbModule = await import(
    pathToFileURL(path.join(backendDir(), 'src', 'config', 'db.config.js')).href
  );
  await dbModule.default.configuracion.updateMany({ data: { serverPort: port } });
}

// ---------------------------------------------------------------------------
// Ventana
// ---------------------------------------------------------------------------

function createWindow(port) {
  backendWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    icon: app.isPackaged ? path.join(__dirname, 'icons', 'icon.png') : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--cafe-pandora-port=${port}`],
    },
  });

  backendWindow.loadURL(`http://127.0.0.1:${port}`);
  backendWindow.on('closed', () => {
    backendWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

process.on('uncaughtException', (err) => {
  log('uncaughtException:', (err && err.stack) || err);
  if (backendWindow) {
    dialog.showErrorBox('Cafe Pandora', `Ocurrió un error inesperado: ${(err && err.message) || err}`);
  }
  app.exit(1);
});

process.on('unhandledRejection', (err) => {
  log('unhandledRejection:', (err && err.stack) || err);
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (backendWindow) {
      if (backendWindow.isMinimized()) backendWindow.restore();
      backendWindow.focus();
    }
  });

  app.whenReady().then(run).catch((err) => {
    console.error('[arranque]', err);
    dialog.showErrorBox('Cafe Pandora', `No se pudo iniciar: ${err.message}`);
    app.exit(1);
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (activeChild) {
    try {
      activeChild.kill();
    } catch {}
  }
});

async function run() {
  dataDir = resolveDataDir();
  fs.mkdirSync(dataDir, { recursive: true });
  setupLogging();
  log(`[arranque] dataDir=${dataDir}`);

  const secrets = loadOrCreateSecrets();
  const dbPath = path.join(dataDir, 'dev.db');

  const engine = resolveQueryEngine();
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.JWT_SECRET = secrets.jwtSecret;
  process.env.JWT_REFRESH_SECRET = secrets.jwtRefreshSecret;
  process.env.PANDORA_DATA_DIR = dataDir;
  if (engine) process.env.PRISMA_QUERY_ENGINE_LIBRARY = engine;

  await runMigrate(dbPath);
  ensureSeedImages();
  await runSeed();

  const port = await findAvailablePort(DEFAULT_PORT);
  if (!port) {
    dialog.showErrorBox(
      'Cafe Pandora',
      `Los puertos ${DEFAULT_PORT}-${DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1} están ocupados. ` +
        'Cierra otras instancias de Cafe Pandora o reinicia el equipo.',
    );
    app.exit(1);
    return;
  }
  if (port !== DEFAULT_PORT) {
    log(`[puerto] ${DEFAULT_PORT} ocupado, usando ${port}`);
    try {
      await updateServerPortInDb(port);
    } catch {}
  }

  process.env.PORT = String(port);
  process.env.PUBLIC_DIR = frontendDir();

  log('[backend] iniciando servidor...');
  const serverModule = await import(
    pathToFileURL(path.join(backendDir(), 'server.js')).href
  );
  await serverModule.startServer();

  log(`[backend] listo en http://127.0.0.1:${port}`);
  createWindow(port);
}

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Puerto donde corre el backend (Express). Debe coincidir con el puerto
// que el frontend espera por defecto (visto en la configuración de la app).
const PORT = 3001;
const BACKEND_URL = `http://localhost:${PORT}`;

let backendProcess = null;
let mainWindow = null;

// ─── Rutas persistentes (sobreviven reinstalaciones/actualizaciones) ────────
// app.getPath('userData') es una carpeta del sistema fuera de la instalación,
// ej: C:\Users\<usuario>\AppData\Roaming\cafe-pandora
// Solo se usa en producción (app.isPackaged) — en desarrollo todo sigue igual.
function prepararDatosPersistentes() {
  const datosDir = app.getPath('userData');
  const dbDestino = path.join(datosDir, 'dev.db');
  const uploadsDestino = path.join(datosDir, 'uploads');

  // Primera vez: copiar la base de datos "semilla" que viene empaquetada
  // (con categorías/usuarios iniciales) a la carpeta persistente.
  if (!fs.existsSync(dbDestino)) {
    const dbOrigen = path.join(process.resourcesPath, 'backend', 'prisma', 'dev.db');
    if (fs.existsSync(dbOrigen)) {
      fs.copyFileSync(dbOrigen, dbDestino);
    }
  }

  // Primera vez: crear (o copiar) la carpeta de uploads.
  if (!fs.existsSync(uploadsDestino)) {
    fs.mkdirSync(uploadsDestino, { recursive: true });
    const uploadsOrigen = path.join(process.resourcesPath, 'backend', 'uploads');
    if (fs.existsSync(uploadsOrigen)) {
      fs.cpSync(uploadsOrigen, uploadsDestino, { recursive: true });
    }
  }

  return {
    databaseUrl: `file:${dbDestino}`,
    uploadsDir: uploadsDestino,
  };
}

function iniciarBackend() {
  // Backend confirmado: backend/server.js (script "start": "node server.js")
  // NOTA: NO usamos el script "dev" (que corre prisma migrate deploy + generate
  // en cada arranque) — eso solo debe correr una vez al instalar/actualizar,
  // no cada vez que se prende la torre.
  const backendEntry = app.isPackaged
    ? path.join(process.resourcesPath, 'backend', 'server.js')
    : path.join(__dirname, '..', 'backend', 'server.js');

  // Log a archivo — en la app empaquetada no hay consola visible, así que
  // cualquier error del backend se guarda aquí para poder revisarlo:
  // %APPDATA%/cafe-pandora/backend.log
  const logPath = path.join(app.getPath('userData'), 'backend.log');
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });
  logStream.write(`\n\n=== Arranque ${new Date().toISOString()} ===\n`);
  logStream.write(`backendEntry: ${backendEntry}\n`);
  logStream.write(`existe backendEntry: ${fs.existsSync(backendEntry)}\n`);

  // Variables extra solo en producción (empaquetado). En desarrollo, el
  // backend sigue usando el DATABASE_URL de su propio .env, sin tocar nada.
  const envExtra = app.isPackaged
    ? (() => {
        const { databaseUrl, uploadsDir } = prepararDatosPersistentes();
        logStream.write(`DATABASE_URL: ${databaseUrl}\n`);
        logStream.write(`UPLOADS_DIR: ${uploadsDir}\n`);
        return { DATABASE_URL: databaseUrl, UPLOADS_DIR: uploadsDir };
      })()
    : {};

  backendProcess = spawn(process.execPath, [backendEntry], {
    env: {
      ...process.env,
      ...envExtra,
      PORT: String(PORT),
      ELECTRON_RUN_AS_NODE: '1', // permite usar el Node embebido en Electron sin instalar Node aparte
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  backendProcess.stdout.on('data', (data) => logStream.write(`[stdout] ${data}`));
  backendProcess.stderr.on('data', (data) => logStream.write(`[stderr] ${data}`));

  backendProcess.on('error', (err) => {
    logStream.write(`[error al lanzar] ${err.stack || err}\n`);
  });

  backendProcess.on('exit', (code, signal) => {
    logStream.write(`[exit] código=${code} señal=${signal}\n`);
  });
}

function crearVentana() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Le da un pequeño margen al backend para levantar antes de cargar la URL.
  // Si ves pantalla en blanco al abrir, sube este valor.
  setTimeout(() => {
    mainWindow.loadURL(BACKEND_URL);
  }, 1500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  iniciarBackend();
  crearVentana();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

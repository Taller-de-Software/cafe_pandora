const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const HASH_RE = /[-.]([0-9a-f]{40})$/;

function getEnginesHash() {
  const pkgPath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@prisma',
    'engines-version',
    'package.json',
  );
  const { version } = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const m = version.match(HASH_RE);
  if (!m) throw new Error(`No se pudo extraer el hash de engines de "${version}"`);
  return m[1];
}

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} para ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

function gunzip(buf) {
  return zlib.gunzipSync(buf);
}

function removeMatching(dir, re) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    if (re.test(f)) fs.rmSync(path.join(dir, f), { force: true });
  }
}

function listEngines(dir) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir).filter((f) => /engine/i.test(f))) {
    console.log(`  - ${f}`);
  }
}

async function main() {
  const hash = getEnginesHash();
  const base = `https://binaries.prisma.sh/all_commits/${hash}/windows`;
  console.log(`[engines-win] engines hash: ${hash}`);

  const targets = [
    { url: `${base}/schema-engine.exe.gz`, file: 'schema-engine-windows.exe' },
    { url: `${base}/query_engine.dll.node.gz`, file: 'query_engine-windows.dll.node' },
  ];

  const enginesDir = path.join(__dirname, '..', 'node_modules', '@prisma', 'engines');
  const generatedDir = path.join(
    __dirname,
    '..',
    '..',
    'backend',
    'generated',
    'prisma',
  );

  const jobs = [];
  for (const t of targets) {
    const data = gunzip(await download(t.url));
    jobs.push({ file: t.file, data });
  }

  removeMatching(enginesDir, /^schema-engine-(?!windows\.exe$)/);
  removeMatching(enginesDir, /^libquery_engine-.*\.so\.node$/);
  removeMatching(generatedDir, /^libquery_engine-.*\.so\.node$/);

  for (const j of jobs) {
    fs.writeFileSync(path.join(enginesDir, j.file), j.data);
    console.log(`[engines-win] ${j.file} -> node_modules/@prisma/engines/ (${j.data.length} bytes)`);
  }
  const qe = jobs.find((j) => j.file.endsWith('.node'));
  fs.writeFileSync(path.join(generatedDir, qe.file), qe.data);
  console.log(`[engines-win] ${qe.file} -> backend/generated/prisma/ (${qe.data.length} bytes)`);

  console.log('[engines-win] contenido node_modules/@prisma/engines/:');
  listEngines(enginesDir);
  console.log('[engines-win] contenido backend/generated/prisma/:');
  listEngines(generatedDir);
}

main().catch((err) => {
  console.error('[engines-win] ERROR:', err.message);
  process.exit(1);
});

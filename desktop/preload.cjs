const { contextBridge } = require('electron');

function getArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

const port = getArg('cafe-pandora-port') || '3001';
const apiUrl = `http://127.0.0.1:${port}/api`;
const socketUrl = `http://127.0.0.1:${port}`;

try {
  localStorage.setItem('cafePandora_apiUrl', apiUrl);
  localStorage.setItem('cafePandora_socketUrl', socketUrl);
} catch {}

contextBridge.exposeInMainWorld('cafePandora', { port, apiUrl, socketUrl });

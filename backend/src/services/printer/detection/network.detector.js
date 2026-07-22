import { Socket } from 'net';
import os from 'os';

const DEFAULT_PORT = 9100;
const TIMEOUT_MS = 2000;

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new Socket();
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, TIMEOUT_MS);
    socket.connect(port, host, () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timer); resolve(false); });
  });
}

function getLocalSubnets() {
  const nets = os.networkInterfaces();
  const subnets = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        const parts = net.address.split('.');
        if (parts.length === 4) {
          subnets.push(`${parts[0]}.${parts[1]}.${parts[2]}`);
        }
      }
    }
  }
  return [...new Set(subnets)];
}

/**
 * Escanea la red local buscando impresoras en puerto 9100.
 * @returns {Promise<import('../printer.types.js').NetworkDiagnostic[]>}
 */
export async function detectNetworkPrinters(port = DEFAULT_PORT) {
  const subnets = getLocalSubnets();
  const results = [];
  const promises = [];

  for (const subnet of subnets) {
    for (let i = 1; i <= 254; i++) {
      const host = `${subnet}.${i}`;
      promises.push(
        checkPort(host, port).then((isOpen) => {
          if (isOpen) results.push({ address: host, port, isOpen: true });
        })
      );
    }
  }

  await Promise.all(promises);
  return results;
}

/**
 * Detecta impresoras de red y las retorna como DetectedPrinter[].
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detect() {
  const printers = await detectNetworkPrinters();
  return printers.map((p) => ({
    id: `network-${p.address}-${p.port}`,
    name: `Network Printer ${p.address}`,
    connectionType: 'network',
    address: p.address,
    port: p.port,
    compatibleMethods: ['network'],
    recommendedMethod: 'network',
    status: 'available',
  }));
}

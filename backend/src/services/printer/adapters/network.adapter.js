import { Socket } from 'net';
import { BasePrinterAdapter } from './adapter.interface.js';

/**
 * Adaptador de red TCP/IP para impresoras ESC/POS.
 * Envia datos raw a la impresora via socket TCP.
 */
export class NetworkAdapter extends BasePrinterAdapter {
  constructor(address, port = 9100, encoding = 'CP858') {
    super(`Network ${address}:${port}`, { type: 'network', address, port });
    this.address = address;
    this.port = port;
    this.encoding = encoding;
    this.socket = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      socket.setTimeout(5000);

      socket.on('connect', () => {
        socket.setTimeout(0);
        this.socket = socket;
        this._connected = true;
        console.log(`[NETWORK] Conectado — ${this.address}:${this.port}`);
        resolve();
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(new Error(`No se pudo conectar a ${this.address}:${this.port}. Error: ${err.message}`));
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`Timeout al conectar a ${this.address}:${this.port}`));
      });

      socket.connect(this.port, this.address);
    });
  }

  async disconnect() {
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch {}
      this.socket = null;
    }
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.socket) throw new Error('No hay conexión de red activa.');
    return new Promise((resolve, reject) => {
      this.socket.write(data, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

import escpos from 'escpos';
import { BasePrinterAdapter } from './adapter.interface.js';

function openDevice(device) {
  return new Promise((resolve, reject) => {
    device.open((error) => { if (error) reject(error); else resolve(); });
  });
}

/**
 * Adaptador de red TCP/IP para impresoras ESC/POS.
 */
export class NetworkAdapter extends BasePrinterAdapter {
  constructor(address, port = 9100, encoding = 'CP858') {
    super(`Network ${address}:${port}`, { type: 'network', address, port });
    this.address = address;
    this.port = port;
    this.encoding = encoding;
    this.printer = null;
    this.device = null;
  }

  async connect() {
    try {
      const device = new escpos.Network(this.address, this.port);
      await openDevice(device);
      this.device = device;
      this.printer = new escpos.Printer(device, { encoding: this.encoding });
      this._connected = true;
      console.log(`[NETWORK] Conectado — ${this.address}:${this.port}`);
    } catch (err) {
      this._connected = false;
      throw new Error(`No se pudo conectar a ${this.address}:${this.port}. Error: ${err.message}`);
    }
  }

  async disconnect() {
    if (this.printer) { try { await new Promise((r) => this.printer.close(() => r())); } catch {} }
    this.printer = null;
    this.device = null;
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.printer) throw new Error('No hay conexión de red activa.');
    return new Promise((resolve, reject) => {
      this.printer.raw(data, (err) => { if (err) reject(err); else resolve(true); });
    });
  }
}

import escpos from 'escpos';
import { BasePrinterAdapter } from './adapter.interface.js';

function openDevice(device) {
  return new Promise((resolve, reject) => {
    device.open((error) => { if (error) reject(error); else resolve(); });
  });
}

/**
 * Adaptador serial para impresoras ESC/POS.
 */
export class SerialAdapter extends BasePrinterAdapter {
  constructor(portPath, baudRate = 9600, encoding = 'CP858') {
    super(`Serial ${portPath}`, { type: 'serial', devicePath: portPath, baudRate });
    this.portPath = portPath;
    this.baudRate = baudRate;
    this.encoding = encoding;
    this.printer = null;
    this.device = null;
  }

  async connect() {
    try {
      const Serial = (await import('escpos/serial')).default;
      const device = new Serial(this.portPath, { baudRate: this.baudRate, autoOpen: false });
      await openDevice(device);
      this.device = device;
      this.printer = new escpos.Printer(device, { encoding: this.encoding });
      this._connected = true;
      console.log(`[SERIAL] Conectado — ${this.portPath} @ ${this.baudRate}`);
    } catch (err) {
      this._connected = false;
      throw new Error(`No se pudo abrir ${this.portPath}. Error: ${err.message}`);
    }
  }

  async disconnect() {
    if (this.printer) { try { await new Promise((r) => this.printer.close(() => r())); } catch {} }
    this.printer = null;
    this.device = null;
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.printer) throw new Error('No hay conexión serial activa.');
    return new Promise((resolve, reject) => {
      this.printer.raw(data, (err) => { if (err) reject(err); else resolve(true); });
    });
  }
}

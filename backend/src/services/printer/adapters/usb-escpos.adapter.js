import escpos from 'escpos';
import { BasePrinterAdapter } from './adapter.interface.js';

function openDevice(device) {
  return new Promise((resolve, reject) => {
    device.open((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * Adaptador USB ESC/POS usando escpos + node-usb.
 * Requiere WinUSB/libusbK (Zadig). NO funciona con usbprint.sys.
 */
export class UsbEscposAdapter extends BasePrinterAdapter {
  constructor(vendorId, productId, encoding = 'CP858') {
    const vidHex = vendorId.toString(16).toUpperCase().padStart(4, '0');
    const pidHex = productId.toString(16).toUpperCase().padStart(4, '0');
    super(`USB ESC/POS ${vidHex}:${pidHex}`, { type: 'usb', vendorId, productId });
    this.vendorId = vendorId;
    this.productId = productId;
    this.encoding = encoding;
    this.printer = null;
    this.device = null;
  }

  async connect() {
    try {
      const device = new escpos.USB(this.vendorId, this.productId);
      await openDevice(device);
      this.device = device;
      this.printer = new escpos.Printer(device, { encoding: this.encoding });
      this._connected = true;
      console.log(`[USB-ESCPOS] Conectado — ${this.getName()} (${this.encoding})`);
    } catch (err) {
      this._connected = false;
      throw new Error(
        `No se pudo abrir USB ${this.vendorId}:${this.productId}. ` +
        `Asegúrese de que el driver sea WinUSB/libusbK. Error: ${err.message}`
      );
    }
  }

  async disconnect() {
    if (this.printer) {
      try { await new Promise((r) => this.printer.close(() => r())); } catch {}
    }
    this.printer = null;
    this.device = null;
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.printer) throw new Error('No hay conexión USB activa.');
    return new Promise((resolve, reject) => {
      this.printer.raw(data, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

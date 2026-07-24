import { BasePrinterAdapter } from './adapter.interface.js';

/**
 * Adaptador serial para impresoras ESC/POS.
 * Envia datos raw a la impresora via puerto serial.
 */
export class SerialAdapter extends BasePrinterAdapter {
  constructor(portPath, baudRate = 9600, encoding = 'CP858') {
    super(`Serial ${portPath}`, { type: 'serial', devicePath: portPath, baudRate });
    this.portPath = portPath;
    this.baudRate = baudRate;
    this.encoding = encoding;
    this.port = null;
  }

  async connect() {
    try {
      const { SerialPort } = await import('serialport');
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: this.baudRate,
        autoOpen: false,
      });

      await new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      this._connected = true;
      console.log(`[SERIAL] Conectado — ${this.portPath} @ ${this.baudRate}`);
    } catch (err) {
      this._connected = false;
      throw new Error(`No se pudo abrir ${this.portPath}. Error: ${err.message}`);
    }
  }

  async disconnect() {
    if (this.port) {
      try {
        if (this.port.isOpen) {
          await new Promise((resolve) => this.port.close(resolve));
        }
      } catch {}
      this.port = null;
    }
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.port) throw new Error('No hay conexión serial activa.');
    return new Promise((resolve, reject) => {
      this.port.write(data, (err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
  }
}

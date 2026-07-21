import usb from 'usb';
import { BasePrinterAdapter } from './adapter.interface.js';

const CHUNK_SIZE = 48;
const CHUNK_TIMEOUT = 8000;

/**
 * Adaptador USB raw con chunked transfer.
 * Fallback cuando escpos.USB falla pero node-usb puede abrir el dispositivo.
 * Requiere WinUSB/libusbK.
 */
export class UsbRawAdapter extends BasePrinterAdapter {
  constructor(vendorId, productId) {
    const vidHex = vendorId.toString(16).toUpperCase().padStart(4, '0');
    const pidHex = productId.toString(16).toUpperCase().padStart(4, '0');
    super(`USB Raw ${vidHex}:${pidHex}`, { type: 'usb', vendorId, productId });
    this.vendorId = vendorId;
    this.productId = productId;
    this.device = null;
    this.outEndpoint = null;
    this.claimedInterface = null;
  }

  async connect() {
    const device = usb.findByIds(this.vendorId, this.productId);
    if (!device) throw new Error(`Dispositivo USB ${this.vendorId}:${this.productId} no encontrado.`);

    try {
      device.open();
      for (const iface of device.interfaces) {
        try {
          iface.claim();
          this.claimedInterface = iface;
          for (const ep of iface.endpoints) {
            if (ep.direction === 'out') {
              this.outEndpoint = ep;
              break;
            }
          }
          if (this.outEndpoint) break;
        } catch {}
      }

      if (!this.outEndpoint) {
        device.close();
        throw new Error('No se encontró endpoint OUT en el dispositivo USB.');
      }

      this.device = device;
      this._connected = true;
      console.log(`[USB-RAW] Conectado — ${this.getName()}`);
    } catch (err) {
      this._connected = false;
      throw err;
    }
  }

  async disconnect() {
    try {
      if (this.claimedInterface) this.claimedInterface.release(true, () => {});
      if (this.device) this.device.close();
    } catch {}
    this.device = null;
    this.outEndpoint = null;
    this.claimedInterface = null;
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.outEndpoint) throw new Error('No hay conexión USB raw activa.');
    return new Promise((resolve, reject) => {
      let offset = 0;
      let anySuccess = false;

      const sendNext = () => {
        if (offset >= data.length) {
          return callback(anySuccess ? null : new Error('No se pudo enviar ningún chunk.'));
        }
        const chunk = data.slice(offset, offset + CHUNK_SIZE);
        offset += CHUNK_SIZE;
        let timedOut = false;
        const timer = setTimeout(() => { timedOut = true; sendNext(); }, CHUNK_TIMEOUT);
        try {
          this.outEndpoint.transfer(chunk, (err) => {
            clearTimeout(timer);
            if (timedOut) return;
            if (!err) anySuccess = true;
            sendNext();
          });
        } catch {
          clearTimeout(timer);
          sendNext();
        }
      };

      const callback = (err) => {
        if (err) reject(err);
        else resolve(true);
      };

      sendNext();
    });
  }
}

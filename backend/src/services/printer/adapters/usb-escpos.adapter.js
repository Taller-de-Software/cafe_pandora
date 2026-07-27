import { BasePrinterAdapter } from './adapter.interface.js';
import { printerLogger } from '../utils/printer-logger.js';

const SAT_VENDOR_ID = 0x0483;
const SAT_PRODUCT_ID = 0x5743;

export class UsbEscposAdapter extends BasePrinterAdapter {
  constructor(vendorId, productId, encoding = 'CP437') {
    const label = `USB-ESC/POS 0x${vendorId.toString(16).padStart(4, '0')}:0x${productId.toString(16).padStart(4, '0')}`;
    super(label, { type: 'usb-escpos', vendorId, productId });
    this.vendorId = vendorId;
    this.productId = productId;
    this.encoding = encoding;
    this.device = null;
    this.endpointNumber = null;
  }

  async connect() {
    try {
      const { usb } = await import('usb');
      const device = await usb.findDeviceByIds(this.vendorId, this.productId);
      if (!device) {
        throw new Error(
          `Impresora USB no encontrada (0x${this.vendorId.toString(16).padStart(4, '0')}:0x${this.productId.toString(16).padStart(4, '0')}). Verifique que esté conectada.`
        );
      }

      await device.open();

      await device.detachKernelDriver(0).catch(() => {});
      await device.claimInterface(0);

      const iface = device.configuration?.interfaces?.[0];
      const endpoint = iface?.alternate?.endpoints?.find((ep) => ep.direction === 'out');
      if (!endpoint) {
        throw new Error('No se encontró endpoint OUT en el dispositivo USB.');
      }

      this.device = device;
      this.endpointNumber = endpoint.endpointNumber;
      this._connected = true;

      printerLogger.connection('connected', this.getName(), 'usb-escpos');
    } catch (err) {
      const msg = `[usb-escpos] Fallo conexión USB: ${err.message}`;
      printerLogger.warn(msg, 'usb-escpos');
      throw new Error(msg);
    }
  }

  async disconnect() {
    if (this.device) {
      try { await this.device.releaseInterface(0); } catch {}
      try { await this.device.close(); } catch {}
    }
    this.device = null;
    this.endpointNumber = null;
    this._connected = false;
  }

  async print(data) {
    if (!this._connected || !this.device || this.endpointNumber === null) {
      throw new Error('No hay conexión USB activa.');
    }

    const result = await this.device.transferOut(this.endpointNumber, data);
    if (result.status !== 'ok') {
      throw new Error(`Error al escribir en USB: status ${result.status}`);
    }
    return true;
  }
}

function isValidVidPid(val) {
  return typeof val === 'number' && Number.isFinite(val) && val > 0 && val <= 0xFFFF;
}

export async function findUsbEscposDevice(vendorId, productId) {
  try {
    const { usb } = await import('usb');
    const vid = isValidVidPid(vendorId) ? vendorId : SAT_VENDOR_ID;
    const pid = isValidVidPid(productId) ? productId : SAT_PRODUCT_ID;
    const device = await usb.findDeviceByIds(vid, pid);
    if (device) {
      return {
        vendorId: vid,
        productId: pid,
        vendorIdHex: `0x${vid.toString(16).toUpperCase().padStart(4, '0')}`,
        productIdHex: `0x${pid.toString(16).toUpperCase().padStart(4, '0')}`,
      };
    }
    return null;
  } catch {
    return null;
  }
}
import usb from 'usb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { detectWindowsDriver, detectInstalledPrinters, isUsbprintDevice, extractVidPidFromPnp } from './windows-driver.detector.js';

const PRINTER_CLASS = 0x07;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _knownPrinters = null;
function getKnownPrinters() {
  if (_knownPrinters) return _knownPrinters;
  try {
    const raw = readFileSync(join(__dirname, '..', 'database', 'known-printers.json'), 'utf-8');
    _knownPrinters = JSON.parse(raw).printers;
  } catch {
    _knownPrinters = [];
  }
  return _knownPrinters;
}

const USB_CLASS_NAMES = {
  0: 'Defined at interface level',
  1: 'Audio',
  2: 'CDC Control',
  3: 'HID',
  5: 'Physical',
  6: 'Image',
  7: 'Printer',
  8: 'Mass Storage',
  9: 'Hub',
  10: 'CDC-Data',
  13: 'Content Security',
  14: 'Video',
  239: 'Application Specific',
  254: 'Vendor Specific',
};

function getUsbClassName(cls) {
  return USB_CLASS_NAMES[cls] || `Unknown (0x${cls.toString(16).toUpperCase()})`;
}

function hexId(id) {
  return id.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Lee las interfaces desde configDescriptor sin claim() ni open().
 * configDescriptor está disponible directamente del device descriptor.
 * Retorna array de { number, class, subclass, protocol }.
 */
function getInterfacesFromConfigDescriptor(device) {
  const interfaces = [];
  try {
    const cfg = device.configDescriptor;
    if (!cfg?.interfaces) return interfaces;
    for (const altSettings of cfg.interfaces) {
      for (const iface of altSettings) {
        interfaces.push({
          number: iface.bInterfaceNumber || 0,
          class: iface.bInterfaceClass || 0,
          subclass: iface.bInterfaceSubClass || 0,
          protocol: iface.bInterfaceProtocol || 0,
        });
      }
    }
  } catch {}
  return interfaces;
}

/**
 * Verifica si un dispositivo tiene al menos una interfaz de clase impresora (0x07).
 * Usa configDescriptor (sin claim, sin open).
 */
function hasPrinterInterface(device) {
  const interfaces = getInterfacesFromConfigDescriptor(device);
  return interfaces.some((iface) => iface.class === PRINTER_CLASS);
}

/**
 * Verifica si un VID:PID corresponde a una impresora real.
 * Busca el dispositivo en la lista USB y chequea configDescriptor.interfaces.
 * @param {number} vendorIdNum
 * @param {number} productIdNum
 * @returns {Promise<boolean>}
 */
export async function isValidPrinterDevice(vendorIdNum, productIdNum) {
  try {
    const devices = usb.getDeviceList();
    const device = devices.find(
      (d) => d.deviceDescriptor.idVendor === vendorIdNum
        && d.deviceDescriptor.idProduct === productIdNum,
    );
    if (!device) return false;
    return hasPrinterInterface(device);
  } catch {
    return false;
  }
}

/**
 * Busca en known-printers.json un nombre legible para el VID.
 * Solo se usa para enriquecer dispositivos ya confirmados como impresora.
 */
function enrichFromCatalog(vendorIdNum) {
  const vidHex = vendorIdNum.toString(16).toUpperCase();
  const printers = getKnownPrinters();
  for (const entry of printers) {
    if (entry.vendorIds.includes(vidHex)) {
      return {
        brandName: entry.name,
        suggestedEncoding: entry.encoding,
        suggestedPaperWidth: entry.paperWidth,
        capabilities: entry.capabilities,
      };
    }
  }
  return null;
}

/**
 * Detecta todos los dispositivos USB impresora conectados.
 * Solo incluye dispositivos que la clase USB o las interfaces confirmen como impresora.
 * @returns {Promise<import('../printer.types.js').UsbDiagnostic[]>}
 */
export async function detectUsbDevices() {
  const result = [];
  const seen = new Set();

  try {
    const devices = usb.getDeviceList();

    for (const device of devices) {
      const desc = device.deviceDescriptor;
      if (!desc) continue;

      const vid = desc.idVendor;
      const pid = desc.idProduct;
      const key = `${vid}:${pid}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const bClass = desc.bDeviceClass;
      let isPrinter = false;
      let interfaces = [];

      if (bClass === PRINTER_CLASS) {
        isPrinter = true;
        interfaces = getInterfacesFromConfigDescriptor(device);
      } else if (bClass === 0xff) {
        isPrinter = true;
        interfaces = getInterfacesFromConfigDescriptor(device);
      } else if (bClass === 0x00) {
        interfaces = getInterfacesFromConfigDescriptor(device);
        isPrinter = interfaces.some((iface) => iface.class === PRINTER_CLASS);
      }

      if (!isPrinter) continue;

      let driver = null;
      let driverType = 'unknown';
      let compatibleWithRawUsb = false;
      let compatibleWithSpooler = false;
      let recommendedMethod = 'usb-escpos';
      let reason = '';

      if (process.platform === 'win32') {
        const driverInfo = await detectWindowsDriver(vid, pid);
        driver = driverInfo.service;
        driverType = driverInfo.driver;
        compatibleWithRawUsb = driverInfo.isCompatibleWithRawUsb;
        compatibleWithSpooler = driverInfo.isCompatibleWithSpooler;

        if (driverInfo.driver === 'usbprint') {
          recommendedMethod = 'windows-spooler';
          reason = 'Windows usa usbprint.sys que bloquea libusb. Use Print Spooler RAW (sin Zadig).';
        } else if (driverInfo.isCompatibleWithRawUsb) {
          recommendedMethod = 'usb-escpos';
          reason = `Driver ${driverInfo.driver} compatible con libusb.`;
        } else {
          recommendedMethod = 'windows-spooler';
          reason = `Driver "${driver}" detectado. Print Spooler es la opción más segura.`;
        }
      } else {
        compatibleWithRawUsb = true;
        recommendedMethod = 'usb-escpos';
        reason = 'Linux/macOS: libusb disponible para acceso raw.';
      }

      result.push({
        vendorId: hexId(vid),
        productId: hexId(pid),
        vendorIdNum: vid,
        productIdNum: pid,
        usbClass: bClass,
        usbClassName: getUsbClassName(bClass),
        driver,
        driverType,
        compatibleWithRawUsb,
        compatibleWithSpooler,
        interfaces,
        recommendedMethod,
        reason,
      });
    }
  } catch (err) {
    console.error('[USB-DETECTOR] Error listing USB devices:', err);
  }

  // En Windows, verificar impresoras instaladas que sean USB
  if (process.platform === 'win32') {
    try {
      const installed = await detectInstalledPrinters();
      for (const printer of installed) {
        if (!isUsbprintDevice(printer.pnpDeviceID)) continue;
        const vidPid = extractVidPidFromPnp(printer.pnpDeviceID);
        if (!vidPid) continue;
        const key = `${vidPid.vendorId}:${vidPid.productId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          vendorId: hexId(vidPid.vendorId),
          productId: hexId(vidPid.productId),
          vendorIdNum: vidPid.vendorId,
          productIdNum: vidPid.productId,
          usbClass: PRINTER_CLASS,
          usbClassName: 'Printer',
          driver: 'usbprint',
          driverType: 'usbprint',
          compatibleWithRawUsb: false,
          compatibleWithSpooler: true,
          interfaces: [],
          recommendedMethod: 'windows-spooler',
          reason: `Impresora "${printer.name}" instalada con usbprint.sys. Print Spooler RAW recomendado.`,
        });
      }
    } catch {}
  }

  return result;
}

/**
 * Detecta impresoras USB y las retorna como DetectedPrinter[].
 * known-printers.json se usa solo para enriquecer (nombre, encoding), nunca para clasificar.
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detect() {
  const devices = await detectUsbDevices();
  return devices.map((d) => {
    const catalog = enrichFromCatalog(d.vendorIdNum);
    const displayName = catalog
      ? `${catalog.brandName} (${d.vendorId}:${d.productId})`
      : `Printer (${d.vendorId}:${d.productId})`;

    return {
      id: `usb-${d.vendorId}-${d.productId}`,
      name: displayName,
      connectionType: d.recommendedMethod,
      vendorId: d.vendorIdNum,
      productId: d.productIdNum,
      driverType: d.driverType,
      driverName: d.driver,
      compatibleMethods: [
        ...(d.compatibleWithSpooler ? ['windows-spooler'] : []),
        ...(d.compatibleWithRawUsb ? ['usb-escpos', 'usb'] : []),
      ],
      recommendedMethod: d.recommendedMethod,
      status: 'available',
      ...(catalog && {
        suggestedEncoding: catalog.suggestedEncoding,
        suggestedPaperWidth: catalog.suggestedPaperWidth,
        capabilities: catalog.capabilities,
      }),
    };
  });
}

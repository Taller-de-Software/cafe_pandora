import usb from 'usb';
import { detectUsbDevices } from '../detection/usb.detector.js';
import { detectInstalledPrinters, isUsbprintDevice } from '../detection/windows-driver.detector.js';
import { detectSerialPorts } from '../detection/serial.detector.js';
import { detectNetworkPrinters } from '../detection/network.detector.js';
import { detectCupsPrinters } from '../detection/cups.detector.js';

/**
 * Cuenta todos los dispositivos USB reales (sin filtro de clase).
 */
function countAllUsbDevices() {
  try {
    return usb.getDeviceList().filter((d) => d.deviceDescriptor).length;
  } catch {
    return 0;
  }
}

/**
 * Genera recomendación de método de impresión.
 */
function generateRecommendation(usbPrinters, installedPrinters, serialPorts, networkPrinters, cupsPrinters, totalUsbCount) {
  // 1. Windows Spooler (usbprint.sys)
  const usbprint = usbPrinters.filter((d) => d.driverType === 'usbprint');
  if (usbprint.length > 0) {
    const first = usbprint[0];
    return {
      method: 'windows-spooler',
      device: `${first.vendorId}:${first.productId}`,
      reason: `Dispositivo USB con driver nativo usbprint.sys detectado. Print Spooler RAW sin Zadig.`,
    };
  }

  const installedUsbprint = installedPrinters.filter((p) => isUsbprintDevice(p.pnpDeviceID));
  if (installedUsbprint.length > 0) {
    return {
      method: 'windows-spooler',
      device: installedUsbprint[0].name,
      reason: `Impresora "${installedUsbprint[0].name}" instalada con driver nativo. Print Spooler RAW recomendado.`,
    };
  }

  // 2. USB raw (WinUSB/libusbK)
  const rawUsb = usbPrinters.filter((d) => d.compatibleWithRawUsb);
  if (rawUsb.length > 0) {
    return {
      method: 'usb-escpos',
      device: `${rawUsb[0].vendorId}:${rawUsb[0].productId}`,
      reason: `Dispositivo USB con driver ${rawUsb[0].driverType} compatible con libusb.`,
    };
  }

  // 3. Network
  if (networkPrinters.length > 0) {
    return {
      method: 'network',
      device: `${networkPrinters[0].address}:${networkPrinters[0].port}`,
      reason: 'Impresora de red detectada en puerto 9100.',
    };
  }

  // 4. Serial
  if (serialPorts.length > 0) {
    return {
      method: 'serial',
      device: serialPorts[0].path,
      reason: 'Puerto serial detectado.',
    };
  }

  // 5. CUPS
  if (cupsPrinters && cupsPrinters.length > 0) {
    return {
      method: 'cups',
      device: cupsPrinters[0].name,
      reason: `Impresora CUPS "${cupsPrinters[0].name}" detectada.`,
    };
  }

  // No printers found at all
  const totalPrinters = usbPrinters.length + (installedPrinters.length) + networkPrinters.length + serialPorts.length + (cupsPrinters?.length || 0);
  return {
    method: null,
    reason: `No se detectó ninguna impresora ESC/POS. Se escanearon ${totalUsbCount} dispositivos USB en el sistema pero ninguno expone una interfaz de clase impresora (0x07).`,
  };
}

/**
 * Genera reporte completo de diagnóstico del sistema de impresión.
 * @returns {Promise<import('../printer.types.js').DiagnosticsReport>}
 */
export async function getDiagnosticsReport() {
  const os = process.platform;

  const totalUsbDevices = countAllUsbDevices();

  let usbDevices = [];
  try { usbDevices = await detectUsbDevices(); } catch (err) { console.error('[DIAG] USB error:', err); }

  let installedPrinters = [];
  if (os === 'win32') {
    try { installedPrinters = await detectInstalledPrinters(); } catch (err) { console.error('[DIAG] Installed error:', err); }
  }

  let serialPorts = [];
  try { serialPorts = await detectSerialPorts(); } catch (err) { console.error('[DIAG] Serial error:', err); }

  let networkPrinters = [];
  try { networkPrinters = await detectNetworkPrinters(); } catch (err) { console.error('[DIAG] Network error:', err); }

  let cupsPrinters = null;
  let cupsDefault = null;
  if (os !== 'win32') {
    try {
      const cups = await detectCupsPrinters();
      cupsPrinters = cups.printers;
      cupsDefault = cups.defaultPrinter;
    } catch (err) { console.error('[DIAG] CUPS error:', err); }
  }

  const recommendation = generateRecommendation(usbDevices, installedPrinters, serialPorts, networkPrinters, cupsPrinters, totalUsbDevices);

  return {
    os,
    platform: `${os} ${process.arch}`,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    totalUsbDevices,
    usbDevices,
    installedPrinters,
    serialPorts,
    networkPrinters,
    cupsPrinters,
    cupsDefault,
    recommendation,
  };
}

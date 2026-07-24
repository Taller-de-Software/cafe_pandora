import { detectInstalledPrinters, isUsbprintDevice } from '../detection/windows-driver.detector.js';

/**
 * Genera recomendación de método de impresión.
 */
function generateRecommendation(installedPrinters, serialPorts, networkPrinters, cupsPrinters) {
  // 1. Siempre recomendar Windows Spooler si hay impresoras instaladas en Windows
  if (installedPrinters.length > 0) {
    const usbprint = installedPrinters.filter((p) => isUsbprintDevice(p.pnpDeviceID));
    if (usbprint.length > 0) {
      return {
        method: 'windows-spooler',
        device: usbprint[0].name,
        reason: `Impresora "${usbprint[0].name}" instalada con driver nativo de Windows. Use Print Spooler.`,
      };
    }
    return {
      method: 'windows-spooler',
      device: installedPrinters[0].name,
      reason: `Impresora "${installedPrinters[0].name}" detectada en Windows Print Spooler.`,
    };
  }

  // 2. Network
  if (networkPrinters.length > 0) {
    return {
      method: 'network',
      device: `${networkPrinters[0].address}:${networkPrinters[0].port}`,
      reason: 'Impresora de red detectada en puerto 9100.',
    };
  }

  // 3. Serial
  if (serialPorts.length > 0) {
    return {
      method: 'serial',
      device: serialPorts[0].path,
      reason: 'Puerto serial detectado.',
    };
  }

  // 4. CUPS
  if (cupsPrinters && cupsPrinters.length > 0) {
    return {
      method: 'cups',
      device: cupsPrinters[0].name,
      reason: `Impresora CUPS "${cupsPrinters[0].name}" detectada.`,
    };
  }

  return {
    method: null,
    reason: 'No se detectó ninguna impresora en el sistema.',
  };
}

/**
 * Genera reporte completo de diagnóstico del sistema de impresión.
 * @returns {Promise<import('../printer.types.js').DiagnosticsReport>}
 */
export async function getDiagnosticsReport() {
  const os = process.platform;

  let installedPrinters = [];
  if (os === 'win32') {
    try { installedPrinters = await detectInstalledPrinters(); } catch (err) { console.error('[DIAG] Installed error:', err); }
  }

  let serialPorts = [];
  try {
    const { detectSerialPorts } = await import('../detection/serial.detector.js');
    serialPorts = await detectSerialPorts();
  } catch {}

  let networkPrinters = [];
  try {
    const { detectNetworkPrinters } = await import('../detection/network.detector.js');
    networkPrinters = await detectNetworkPrinters();
  } catch {}

  let cupsPrinters = null;
  let cupsDefault = null;
  if (os !== 'win32') {
    try {
      const { detectCupsPrinters } = await import('../detection/cups.detector.js');
      const cups = await detectCupsPrinters();
      cupsPrinters = cups.printers;
      cupsDefault = cups.defaultPrinter;
    } catch (err) { console.error('[DIAG] CUPS error:', err); }
  }

  const recommendation = generateRecommendation(installedPrinters, serialPorts, networkPrinters, cupsPrinters);

  return {
    os,
    platform: `${os} ${process.arch}`,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    installedPrinters,
    serialPorts,
    networkPrinters,
    cupsPrinters,
    cupsDefault,
    recommendation,
  };
}

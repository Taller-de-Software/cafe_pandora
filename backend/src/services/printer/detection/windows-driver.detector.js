import { execSync } from 'child_process';

/** @type {Map<string, import('./printer.types.js').WindowsDriverInfo>} */
const DRIVER_CACHE = new Map();

/**
 * Clasifica el nombre del servicio de Windows en una categoría de driver.
 * @param {string|null} service
 * @returns {import('./printer.types.js').WindowsDriverInfo}
 */
function classifyDriver(service) {
  if (!service) {
    return {
      service: null,
      driver: 'unknown',
      isCompatibleWithRawUsb: false,
      isCompatibleWithSpooler: false,
      description: 'No se pudo detectar el driver del dispositivo.',
    };
  }

  const s = service.toLowerCase().trim();

  if (s === 'usbprint') {
    return {
      service,
      driver: 'usbprint',
      isCompatibleWithRawUsb: false,
      isCompatibleWithSpooler: true,
      description:
        'Driver nativo de Windows (usbprint.sys). Reclama el dispositivo y bloquea libusb. ' +
        'Use Windows Print Spooler en modo RAW sin necesidad de Zadig.',
    };
  }

  if (s === 'winusb') {
    return {
      service,
      driver: 'winusb',
      isCompatibleWithRawUsb: true,
      isCompatibleWithSpooler: false,
      description: 'WinUSB (WinUSB.SYS). Instalado via Zadig. Compatible con node-usb/libusb.',
    };
  }

  if (s === 'libusbk') {
    return {
      service,
      driver: 'libusbk',
      isCompatibleWithRawUsb: true,
      isCompatibleWithSpooler: false,
      description: 'libusbK (libusbK.sys). Instalado via Zadig. Compatible con node-usb/libusb.',
    };
  }

  if (s === 'libusb0') {
    return {
      service,
      driver: 'libusb0',
      isCompatibleWithRawUsb: true,
      isCompatibleWithSpooler: false,
      description: 'libusb-win32 legacy (libusb0.sys). Compatible con node-usb/libusb.',
    };
  }

  return {
    service,
    driver: 'unknown',
    isCompatibleWithRawUsb: false,
    isCompatibleWithSpooler: false,
    description: `Driver "${service}" detectado. Compatibilidad con node-usb desconocida.`,
  };
}

/**
 * Detecta el driver Windows actual de un dispositivo USB por VID/PID.
 * Usa WMI (Get-CimInstance Win32_PnPEntity) via PowerShell.
 * @param {number} vendorId
 * @param {number} productId
 * @returns {Promise<import('./printer.types.js').WindowsDriverInfo>}
 */
export async function detectWindowsDriver(vendorId, productId) {
  if (process.platform !== 'win32') {
    return classifyDriver(null);
  }

  const cacheKey = `${vendorId}:${productId}`;
  if (DRIVER_CACHE.has(cacheKey)) {
    return DRIVER_CACHE.get(cacheKey);
  }

  const vidHex = vendorId.toString(16).toUpperCase().padStart(4, '0');
  const pidHex = productId.toString(16).toUpperCase().padStart(4, '0');
  const hwIdPattern = `USB\\VID_${vidHex}&PID_${pidHex}*`;

  const psScript = [
    '$ErrorActionPreference = "SilentlyContinue"',
    `$devices = Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPDeviceID -like '${hwIdPattern}' }`,
    'if ($devices) {',
    '  $usb = $devices | Where-Object { $_.DeviceID -like "USB\\VID_*" } | Select-Object -First 1',
    '  if ($usb) { Write-Output $usb.Service }',
    '  else { Write-Output $devices[0].Service }',
    '}',
  ].join('\r\n');

  try {
    const escaped = psScript.replace(/"/g, '\\"');
    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${escaped}"`,
      { timeout: 8000, windowsHide: true, encoding: 'utf-8' }
    );
    const service = result.trim() || null;
    const info = classifyDriver(service);
    DRIVER_CACHE.set(cacheKey, info);
    return info;
  } catch {
    const info = classifyDriver(null);
    DRIVER_CACHE.set(cacheKey, info);
    return info;
  }
}

/** Limpia la cache de drivers detectados. */
export function clearDriverCache() {
  DRIVER_CACHE.clear();
}

/**
 * Detecta impresoras instaladas en Windows Print Spooler.
 * @returns {Promise<import('./printer.types.js').InstalledPrinter[]>}
 */
export async function detectInstalledPrinters() {
  if (process.platform !== 'win32') return [];

  const psScript = [
    'Get-CimInstance Win32_Printer | Select-Object Name, PortName, DriverName, PNPDeviceID, PrintJobDataType, PrinterStatus |',
    'ConvertTo-Json -Depth 3',
  ].join('\r\n');

  try {
    const escaped = psScript.replace(/"/g, '\\"');
    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${escaped}"`,
      { timeout: 10000, windowsHide: true, encoding: 'utf-8' }
    );

    const parsed = JSON.parse(result);
    const printers = Array.isArray(parsed) ? parsed : [parsed];

    return printers
      .filter((p) => p && p.Name)
      .map((p) => ({
        name: p.Name || '',
        portName: p.PortName || '',
        driverName: p.DriverName || '',
        pnpDeviceID: p.PNPDeviceID || '',
        dataType: p.PrintJobDataType || '',
        canPrintEscPos: (p.PrintJobDataType || '').toUpperCase() === 'RAW',
        status: p.PrinterStatus || 0,
      }));
  } catch {
    return [];
  }
}

/**
 * Verifica si un PNPDeviceID corresponde a usbprint.
 * @param {string} pnpDeviceID
 * @returns {boolean}
 */
export function isUsbprintDevice(pnpDeviceID) {
  return pnpDeviceID.toUpperCase().startsWith('USBPRINT\\');
}

/**
 * Extrae vendorId y productId de un PNPDeviceID.
 * @param {string} pnpDeviceID
 * @returns {{ vendorId: number, productId: number } | null}
 */
export function extractVidPidFromPnp(pnpDeviceID) {
  const match = pnpDeviceID.match(/VID_([0-9A-Fa-f]{4})&PID_([0-9A-Fa-f]{4})/i);
  if (!match) return null;
  return {
    vendorId: parseInt(match[1], 16),
    productId: parseInt(match[2], 16),
  };
}

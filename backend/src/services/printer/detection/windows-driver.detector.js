import { execSync } from 'child_process';

/**
 * Detecta impresoras instaladas en Windows Print Spooler.
 * @returns {Promise<{ name: string, portName: string, driverName: string, pnpDeviceID: string, canPrintEscPos: boolean, status: number }[]>}
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
  if (!pnpDeviceID) return false;
  return pnpDeviceID.toUpperCase().startsWith('USBPRINT\\');
}

/**
 * Extrae vendorId y productId de un PNPDeviceID.
 * @param {string} pnpDeviceID
 * @returns {{ vendorId: number, productId: number } | null}
 */
export function extractVidPidFromPnp(pnpDeviceID) {
  if (!pnpDeviceID) return null;
  const match = pnpDeviceID.match(/VID_([0-9A-Fa-f]{4})&PID_([0-9A-Fa-f]{4})/i);
  if (!match) return null;
  return {
    vendorId: parseInt(match[1], 16),
    productId: parseInt(match[2], 16),
  };
}

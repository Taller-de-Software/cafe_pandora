import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { detectInstalledPrinters, isUsbprintDevice, extractVidPidFromPnp } from './windows-driver.detector.js';

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

function enrichFromCatalog(vendorIdNum) {
  if (vendorIdNum == null) return null;
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
 * Detecta impresoras instaladas en Windows que sean USB (USBPRINT).
 * Usa WMI para obtener las impresoras instaladas en Windows.
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detect() {
  if (process.platform !== 'win32') return [];

  try {
    const installed = await detectInstalledPrinters();
    const result = [];

    for (const printer of installed) {
      const vidPid = extractVidPidFromPnp(printer.pnpDeviceID);
      const vidNum = vidPid?.vendorId;
      const pidNum = vidPid?.productId;
      const catalog = vidNum ? enrichFromCatalog(vidNum) : null;

      const vidHex = vidNum?.toString(16).toUpperCase().padStart(4, '0');
      const pidHex = pidNum?.toString(16).toUpperCase().padStart(4, '0');

      const displayName = catalog
        ? `${catalog.brandName} (${printer.name})`
        : printer.name;

      result.push({
        id: `windows-${printer.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
        name: displayName,
        connectionType: 'windows-spooler',
        vendorId: vidNum,
        productId: pidNum,
        vendorIdHex: vidHex ? `0x${vidHex}` : null,
        productIdHex: pidHex ? `0x${pidHex}` : null,
        pnpDeviceID: printer.pnpDeviceID,
        compatibleMethods: ['windows-spooler'],
        recommendedMethod: 'windows-spooler',
        status: 'available',
        ...(catalog && {
          suggestedEncoding: catalog.suggestedEncoding,
          suggestedPaperWidth: catalog.suggestedPaperWidth,
          capabilities: catalog.capabilities,
        }),
      });
    }

    return result;
  } catch {
    return [];
  }
}

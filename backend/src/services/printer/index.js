// ─── Service (Main API) ─────────────────────────────────────────────────────
export {
  detectPrinters,
  getDiagnostics,
  testConnection,
  printTest,
  printCocina,
  printPago,
  printCierre,
  listWindowsPrintersList,
  smartConnect,
} from './printer.service.js';

// ─── Detection ───────────────────────────────────────────────────────────────
export { detectAllPrinters } from './detection/index.js';
export { detectUsbDevices } from './detection/usb.detector.js';
export { detectSerialPorts } from './detection/serial.detector.js';
export { detectNetworkPrinters } from './detection/network.detector.js';
export { detectCupsPrinters } from './detection/cups.detector.js';
export { detectWindowsDriver, detectInstalledPrinters, clearDriverCache } from './detection/windows-driver.detector.js';

// ─── Diagnostics ─────────────────────────────────────────────────────────────
export { getDiagnosticsReport } from './diagnostics/diagnostics.service.js';

// ─── Adapters ────────────────────────────────────────────────────────────────
export { BasePrinterAdapter } from './adapters/adapter.interface.js';
export { WindowsSpoolerAdapter, listWindowsPrinters } from './adapters/windows-spooler.adapter.js';
export { UsbEscposAdapter } from './adapters/usb-escpos.adapter.js';
export { UsbRawAdapter } from './adapters/usb-raw.adapter.js';
export { NetworkAdapter } from './adapters/network.adapter.js';
export { SerialAdapter } from './adapters/serial.adapter.js';
export { CupsAdapter } from './adapters/cups.adapter.js';

// ─── Templates ───────────────────────────────────────────────────────────────
export { buildCocinaTicket, buildPagoTicket, buildCierreTicket } from './templates/ticket.builder.js';

// ─── Utils ───────────────────────────────────────────────────────────────────
export { buildPrinterError, getLastError, clearLastError } from './utils/printer-errors.js';
export { printerLogger } from './utils/printer-logger.js';

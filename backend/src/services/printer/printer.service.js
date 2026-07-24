import prisma from '../../config/db.config.js';
import { detectAllPrinters } from './detection/index.js';
import { getDiagnosticsReport } from './diagnostics/diagnostics.service.js';
import { WindowsSpoolerAdapter, listWindowsPrinters } from './adapters/windows-spooler.adapter.js';
import { NetworkAdapter } from './adapters/network.adapter.js';
import { SerialAdapter } from './adapters/serial.adapter.js';
import { CupsAdapter } from './adapters/cups.adapter.js';
import { buildCocinaTicket, buildPagoTicket, buildCierreTicket } from './templates/ticket.builder.js';
import { buildPrinterError, clearLastError } from './utils/printer-errors.js';
import { printerLogger } from './utils/printer-logger.js';

const DEFAULT_ENCODING = 'CP437';

// ─── Config from DB ──────────────────────────────────────────────────────────

export async function getConfig() {
  try {
    const config = await prisma.configuracion.findFirst();
    if (!config) return { modoImpresion: 'simulacion' };

    return {
      _id: config.id,
      modoImpresion: config.modoImpresion || 'simulacion',
      printerName: config.printerName,
      printerConnectionType: config.printerConnectionType,
      printerVendorId: config.printerVendorId,
      printerProductId: config.printerProductId,
      printerAddress: config.printerAddress,
      printerNetPort: config.printerNetPort,
      printerSerialPort: config.printerSerialPort,
      printerBaudRate: config.printerBaudRate,
      printerEncoding: config.printerEncoding,
      lastWorkingMethod: config.lastWorkingMethod,
      lastWorkingDevice: config.lastWorkingDevice,
    };
  } catch {
    return { modoImpresion: 'simulacion' };
  }
}

// ─── Adapter Factory ─────────────────────────────────────────────────────────

function createAdapter(connectionType, config) {
  switch (connectionType) {
    case 'windows-spooler':
      return new WindowsSpoolerAdapter(config.printerName || 'Printer');

    case 'network':
      if (!config.printerAddress) throw new Error('Se requiere dirección IP para red.');
      return new NetworkAdapter(config.printerAddress, config.printerNetPort || 9100, config.printerEncoding || DEFAULT_ENCODING);

    case 'serial':
      if (!config.printerSerialPort) throw new Error('Se requiere puerto serial.');
      return new SerialAdapter(config.printerSerialPort, config.printerBaudRate || 9600, config.printerEncoding || DEFAULT_ENCODING);

    case 'cups':
      return new CupsAdapter(config.printerName || 'default', config.printerEncoding || DEFAULT_ENCODING);

    default:
      throw new Error(`Tipo de conexión no soportado: ${connectionType}`);
  }
}

function canUseMethod(method, config) {
  switch (method) {
    case 'windows-spooler': return process.platform === 'win32';
    case 'network': return !!config.printerAddress;
    case 'serial': return !!config.printerSerialPort;
    case 'cups': return process.platform !== 'win32';
    default: return false;
  }
}

// ─── Smart Connect ───────────────────────────────────────────────────────────

function checkNetworkHost(host, port) {
  return new Promise((resolve) => {
    import('net').then(({ Socket }) => {
      const socket = new Socket();
      const timer = setTimeout(() => { socket.destroy(); resolve(false); }, 2000);
      socket.connect(port, host, () => { clearTimeout(timer); socket.destroy(); resolve(true); });
      socket.on('error', () => { clearTimeout(timer); resolve(false); });
    }).catch(() => resolve(false));
  });
}

export async function smartConnect(overrideConfig = {}) {
  const baseConfig = await getConfig();
  const config = { ...baseConfig, ...overrideConfig };

  if (config.modoImpresion !== 'real') {
    throw new Error('Modo simulacion activo. No se requiere impresora fisica.');
  }

  let availableSerialPorts = [];
  try {
    const { SerialPort } = await import('serialport');
    availableSerialPorts = (await SerialPort.list()).map((p) => p.path);
  } catch {}

  const configuredType = config.printerConnectionType;
  const lastWorking = config.lastWorkingMethod;
  const methodsToTry = [];

  if (lastWorking && !methodsToTry.includes(lastWorking)) methodsToTry.push(lastWorking);
  if (configuredType && !methodsToTry.includes(configuredType)) methodsToTry.push(configuredType);

  const fallbacks = ['windows-spooler', 'network', 'serial'];
  for (const fb of fallbacks) {
    if (!methodsToTry.includes(fb)) methodsToTry.push(fb);
  }

  const errors = [];

  for (const method of methodsToTry) {
    try {
      if (!canUseMethod(method, config)) continue;

      // --- Spooler: printer name must exist in Windows installed printers ---
      if (method === 'windows-spooler') {
        if (!config.printerName) continue;
        try {
          const installed = await listWindowsPrinters();
          const exists = installed.some((p) => p.name === config.printerName);
          if (!exists) {
            printerLogger.warn(
              `Se omite ${method}: "${config.printerName}" no esta instalada en Windows Print Spooler.`,
              method,
            );
            errors.push(`[${method}] Impresora "${config.printerName}" no encontrada en el sistema`);
            continue;
          }
        } catch {
          // If we cannot list printers (not on Windows), let the adapter fail naturally
        }
      }

      // --- Serial: port path must exist in system serial ports ---
      if (method === 'serial') {
        if (!config.printerSerialPort) continue;
        if (availableSerialPorts.length > 0 && !availableSerialPorts.includes(config.printerSerialPort)) {
          printerLogger.warn(
            `Se omite ${method}: puerto ${config.printerSerialPort} no encontrado en el sistema.`,
            method,
          );
          errors.push(`[${method}] Puerto ${config.printerSerialPort} no existe`);
          continue;
        }
      }

      // --- Network: configured IP must respond on TCP port ---
      if (method === 'network') {
        if (!config.printerAddress) continue;
        const port = config.printerNetPort || 9100;
        const reachable = await checkNetworkHost(config.printerAddress, port);
        if (!reachable) {
          printerLogger.warn(
            `Se omite ${method}: ${config.printerAddress}:${port} no responde.`,
            method,
          );
          errors.push(`[${method}] ${config.printerAddress}:${port} no accesible`);
          continue;
        }
      }

      const adapter = createAdapter(method, config);
      printerLogger.connection('connecting', adapter.getName(), method);
      await adapter.connect();
      printerLogger.connection('connected', adapter.getName(), method);

      // Save the working method for next time
      try {
        if (baseConfig._id) {
          await prisma.configuracion.update({
            where: { id: baseConfig._id },
            data: { lastWorkingMethod: method, lastWorkingDevice: adapter.getName() },
          });
        }
      } catch { /* non-critical, ignore */ }

      return { adapter, method };
    } catch (err) {
      const msg = `[${method}] ${err.message}`;
      errors.push(msg);
      printerLogger.warn(`Fallback: ${msg}`, method);
    }
  }

  throw new Error(`No se pudo conectar con ningun metodo.\n${errors.map((e) => `  - ${e}`).join('\n')}`);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function detectPrinters() {
  return detectAllPrinters();
}

export async function getDiagnostics() {
  return getDiagnosticsReport();
}

export async function testConnection() {
  try {
    const { adapter, method } = await smartConnect();
    await adapter.disconnect();
    clearLastError();
    return { success: true, message: `Conexión exitosa via ${method} — ${adapter.getName()}`, method };
  } catch (err) {
    const printerError = buildPrinterError(err);
    return { success: false, message: printerError.message, error: printerError };
  }
}

export async function printTest() {
  const config = await getConfig();
  if (config.modoImpresion !== 'real') { printerLogger.info('Modo simulación — no se imprime'); return true; }
  return printCocina({
    pedidoId: 'TEST',
    mesa: 'PRUEBA',
    mozo: 'Sistema',
    items: [
      { quantity: 1, name: 'PRUEBA DE IMPRESIÓN', note: 'Ticket de prueba' },
      { quantity: 1, name: 'Línea 2', note: 'Verificar corte' },
    ],
  });
}

export async function printCocina(data) {
  const config = await getConfig();
  if (config.modoImpresion !== 'real') return true;
  const encoding = config.printerEncoding || DEFAULT_ENCODING;
  let adapter = null;
  let method = null;
  try {
    ({ adapter, method } = await smartConnect());
    const ticket = buildCocinaTicket(data, encoding);
    printerLogger.print('sending', adapter.getName(), method);
    const result = await adapter.print(ticket);
    printerLogger.print('sent', adapter.getName(), method);
    clearLastError();
    return result;
  } catch (err) {
    printerLogger.error('Error en printCocina', err, method);
    buildPrinterError(err, { connectionType: method, device: adapter?.getName() });
    return false;
  } finally {
    if (adapter) await adapter.disconnect();
  }
}

export async function printPago(data) {
  const config = await getConfig();
  if (config.modoImpresion !== 'real') return true;
  const encoding = config.printerEncoding || DEFAULT_ENCODING;
  let adapter = null;
  let method = null;
  try {
    ({ adapter, method } = await smartConnect());
    const ticket = buildPagoTicket(data, encoding);
    printerLogger.print('sending', adapter.getName(), method);
    const result = await adapter.print(ticket);
    printerLogger.print('sent', adapter.getName(), method);
    clearLastError();
    return result;
  } catch (err) {
    printerLogger.error('Error en printPago', err, method);
    buildPrinterError(err, { connectionType: method, device: adapter?.getName() });
    return false;
  } finally {
    if (adapter) await adapter.disconnect();
  }
}

export async function printCierre(data) {
  const config = await getConfig();
  if (config.modoImpresion !== 'real') return true;
  const encoding = config.printerEncoding || DEFAULT_ENCODING;
  let adapter = null;
  let method = null;
  try {
    ({ adapter, method } = await smartConnect());
    const ticket = buildCierreTicket(data, encoding);
    printerLogger.print('sending', adapter.getName(), method);
    const result = await adapter.print(ticket);
    printerLogger.print('sent', adapter.getName(), method);
    clearLastError();
    return result;
  } catch (err) {
    printerLogger.error('Error en printCierre', err, method);
    buildPrinterError(err, { connectionType: method, device: adapter?.getName() });
    return false;
  } finally {
    if (adapter) await adapter.disconnect();
  }
}

export async function listWindowsPrintersList() {
  return listWindowsPrinters();
}

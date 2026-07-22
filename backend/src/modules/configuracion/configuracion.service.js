import prisma from "../../config/db.config.js";
import { invalidateConfigCache } from "../../config/network.js";

// ─── Modo impresión ─────────────────────────────────────────────────────────

export const obtenerModoImpresion = async () => {
  try {
    const config = await prisma.configuracion.findFirst();
    return { modoImpresion: config?.modoImpresion ?? "simulacion" };
  } catch (err) {
    console.error("Error reading print mode, returning default:", err.message);
    return { modoImpresion: "simulacion" };
  }
};

export const actualizarModoImpresion = async (mode) => {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: { modoImpresion: mode },
    update: { modoImpresion: mode },
  });
  return { modoImpresion: mode };
};

// ─── Configuración completa de impresión ────────────────────────────────────

export const obtenerConfigImpresion = async () => {
  try {
    const config = await prisma.configuracion.findFirst();
    if (!config) {
      return {
        modoImpresion: "simulacion",
        printerName: null,
        printerConnectionType: "usb",
        printerVendorId: null,
        printerProductId: null,
        printerAddress: null,
        printerNetPort: 9100,
        printerSerialPort: null,
        printerBaudRate: 9600,
        printerEncoding: "CP858",
        frontendPort: 5173,
      };
    }
    return {
      modoImpresion: config.modoImpresion,
      printerName: config.printerName,
      printerConnectionType: config.printerConnectionType,
      printerVendorId: config.printerVendorId,
      printerProductId: config.printerProductId,
      printerAddress: config.printerAddress,
      printerNetPort: config.printerNetPort,
      printerSerialPort: config.printerSerialPort,
      printerBaudRate: config.printerBaudRate,
      printerEncoding: config.printerEncoding,
      frontendPort: config.frontendPort,
      lastWorkingMethod: config.lastWorkingMethod,
      lastWorkingDevice: config.lastWorkingDevice,
    };
  } catch (err) {
    console.error("Error reading print config, returning defaults:", err.message);
    return {
      modoImpresion: "simulacion",
      printerName: null,
      printerConnectionType: "usb",
      printerVendorId: null,
      printerProductId: null,
      printerAddress: null,
      printerNetPort: 9100,
      printerSerialPort: null,
      printerBaudRate: 9600,
      printerEncoding: "CP858",
      frontendPort: 5173,
      lastWorkingMethod: null,
      lastWorkingDevice: null,
    };
  }
};

export const guardarPrinterConfig = async (data) => {
  const {
    printerName,
    printerConnectionType,
    printerVendorId,
    printerProductId,
    printerAddress,
    printerNetPort,
    printerSerialPort,
    printerBaudRate,
    printerEncoding,
  } = data;

  // --- USB: VID/PID must be a real printer (interface 0x07) ---
  if (['usb-escpos', 'usb'].includes(printerConnectionType)
      && printerVendorId != null && printerProductId != null) {
    const { isValidPrinterDevice } = await import('../../services/printer/detection/usb.detector.js');
    const isValid = await isValidPrinterDevice(printerVendorId, printerProductId);
    if (!isValid) {
      const error = new Error(
        'El dispositivo seleccionado no es una impresora. '
        + 'VID:PID ' + printerVendorId.toString(16).toUpperCase()
        + ':' + printerProductId.toString(16).toUpperCase()
        + ' no expone una interfaz de clase impresora (0x07). Verifique que sea un dispositivo ESC/POS.',
      );
      error.statusCode = 400;
      error.codigo = 'USB_NO_PRINTER';
      error.sugerencia = 'Conecte una impresora ESC/POS y seleccionala de la lista de dispositivos detectados.';
      throw error;
    }
  }

  // --- Spooler: printer name must be installed in Windows ---
  if (printerConnectionType === 'windows-spooler' && printerName) {
    try {
      const { listWindowsPrinters } = await import('../../services/printer/adapters/windows-spooler.adapter.js');
      const installed = await listWindowsPrinters();
      const exists = installed.some((p) => p.name === printerName);
      if (!exists) {
        const error = new Error(
          'La impresora "' + printerName + '" no esta instalada en Windows Print Spooler.',
        );
        error.statusCode = 400;
        error.codigo = 'PRINTER_NOT_INSTALLED';
        error.sugerencia = 'Instale la impresora en Windows y seleccionala de la lista de impresoras del sistema.';
        throw error;
      }
    } catch (err) {
      if (err.statusCode) throw err;
      // If verification fails (not on Windows), allow the save
    }
  }

  const config = await prisma.configuracion.upsert({
    where: { id: 1 },
    create: {
      printerName: printerName ?? null,
      printerConnectionType: printerConnectionType ?? "usb",
      printerVendorId: printerVendorId ?? null,
      printerProductId: printerProductId ?? null,
      printerAddress: printerAddress ?? null,
      printerNetPort: printerNetPort ?? 9100,
      printerSerialPort: printerSerialPort ?? null,
      printerBaudRate: printerBaudRate ?? 9600,
      printerEncoding: printerEncoding ?? "CP858",
    },
    update: {
      ...(printerName !== undefined && { printerName: printerName ?? null }),
      ...(printerConnectionType !== undefined && { printerConnectionType }),
      ...(printerVendorId !== undefined && { printerVendorId: printerVendorId ?? null }),
      ...(printerProductId !== undefined && { printerProductId: printerProductId ?? null }),
      ...(printerAddress !== undefined && { printerAddress: printerAddress ?? null }),
      ...(printerNetPort !== undefined && { printerNetPort: printerNetPort ?? 9100 }),
      ...(printerSerialPort !== undefined && { printerSerialPort: printerSerialPort ?? null }),
      ...(printerBaudRate !== undefined && { printerBaudRate: printerBaudRate ?? 9600 }),
      ...(printerEncoding !== undefined && { printerEncoding }),
    },
  });

  return {
    printerName: config.printerName,
    printerConnectionType: config.printerConnectionType,
    printerVendorId: config.printerVendorId,
    printerProductId: config.printerProductId,
    printerAddress: config.printerAddress,
    printerNetPort: config.printerNetPort,
    printerSerialPort: config.printerSerialPort,
    printerBaudRate: config.printerBaudRate,
    printerEncoding: config.printerEncoding,
  };
};

// ─── Frontend port ──────────────────────────────────────────────────────────

export const obtenerFrontendPort = async () => {
  try {
    const config = await prisma.configuracion.findFirst();
    return { frontendPort: config?.frontendPort ?? 5173 };
  } catch (err) {
    console.error("Error reading frontend port, returning default:", err.message);
    return { frontendPort: 5173 };
  }
};

export const guardarFrontendPort = async (port) => {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: { frontendPort: port },
    update: { frontendPort: port },
  });
  return { frontendPort: port };
};

// ─── Database health check ──────────────────────────────────────────────

export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, message: "Database connection healthy" };
  } catch (err) {
    return { ok: false, message: err.message };
  }
};

// ─── Preferred network interface ───────────────────────────────────────

export const obtenerPreferredInterface = async () => {
  try {
    const config = await prisma.configuracion.findFirst();
    return { preferredInterfaceName: config?.preferredInterfaceName ?? null };
  } catch (err) {
    console.error("Error reading preferred interface, returning default:", err.message);
    return { preferredInterfaceName: null };
  }
};

export const guardarPreferredInterface = async (name) => {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: { preferredInterfaceName: name ?? null },
    update: { preferredInterfaceName: name ?? null },
  });
  invalidateConfigCache();
  return { preferredInterfaceName: name ?? null };
};

// ─── General configuration ──────────────────────────────────────────────

const DEFAULT_CONFIG = {
  serverHost: "0.0.0.0",
  serverPort: 3001,
  frontendPort: 5173,
  corsOrigins: "http://localhost:5173,http://localhost:3000",
  sessionTtlMin: 600,
  pinMaxAttempts: 5,
  pinLockoutMin: 15,
  offlineModeEnabled: true,
  qrCodeEnabled: true,
};

export const obtenerConfigGeneral = async () => {
  try {
    const config = await prisma.configuracion.findFirst();
    if (!config) return DEFAULT_CONFIG;
    return {
      serverHost: config.serverHost,
      serverPort: config.serverPort,
      frontendPort: config.frontendPort,
      corsOrigins: config.corsOrigins,
      sessionTtlMin: config.sessionTtlMin,
      pinMaxAttempts: config.pinMaxAttempts,
      pinLockoutMin: config.pinLockoutMin,
      offlineModeEnabled: config.offlineModeEnabled,
      qrCodeEnabled: config.qrCodeEnabled,
    };
  } catch (err) {
    console.error("Error reading general config, returning defaults:", err.message);
    return DEFAULT_CONFIG;
  }
};

export const guardarConfigGeneral = async (data) => {
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: filtered,
    update: filtered,
  });
  invalidateConfigCache();
  return obtenerConfigGeneral();
};

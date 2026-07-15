import prisma from "../../config/db.config.js";

// ─── Modo impresión ─────────────────────────────────────────────────────────

export const obtenerModoImpresion = async () => {
  const config = await prisma.configuracion.findFirst();
  return { modoImpresion: config?.modoImpresion ?? "simulacion" };
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
  };
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
  const config = await prisma.configuracion.findFirst();
  return { frontendPort: config?.frontendPort ?? 5173 };
};

export const guardarFrontendPort = async (port) => {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: { frontendPort: port },
    update: { frontendPort: port },
  });
  return { frontendPort: port };
};

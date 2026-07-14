import prisma from "../../config/db.config.js";
import { getNetworkDiagnostics } from "../../config/network.js";
import { connectPrinter, disconnectPrinter } from "../../utils/printer.js";

export const obtenerDiagnosticoCompleto = async () => {
  const network = await getNetworkDiagnostics();

  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatency = Date.now() - dbStart;

  const config = await prisma.configuracion.findFirst();
  const modoImpresion = config?.modoImpresion ?? "simulacion";

  let printer = { connected: false, error: null };
  if (modoImpresion === "real") {
    try {
      await connectPrinter();
      printer = { connected: true };
      disconnectPrinter();
    } catch (err) {
      printer = { connected: false, error: err.message };
    }
  } else {
    printer = { connected: true, simulated: true };
  }

  let connectedClients = 0;
  let rooms = {};

  if (global.io) {
    for (const [, socket] of global.io.sockets.sockets) {
      connectedClients++;
    }
    rooms = global.io.sockets.adapter.rooms;
  }

  return {
    timestamp: network.timestamp,
    servidor: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    red: network,
    baseDeDatos: {
      connected: true,
      latencyMs: dbLatency,
    },
    impresora: {
      modo: modoImpresion,
      ...printer,
      encoding: config?.printerEncoding ?? "CP858",
      vendorId: config?.printerVendorId,
      productId: config?.printerProductId,
    },
    socket: {
      connectedClients,
      rooms: Object.fromEntries(
        Array.from(rooms.entries()).map(([k, v]) => [k, v.size])
      ),
    },
    autenticacion: {
      activeSessions: 0,
      lockedUsers: [],
    },
  };
};

export const probarImpresora = async () => {
  const config = await prisma.configuracion.findFirst();
  const modoImpresion = config?.modoImpresion ?? "simulacion";

  if (modoImpresion === "simulacion") {
    return {
      success: true,
      simulated: true,
      message: "Modo simulación activo - prueba exitosa",
    };
  }

  try {
    await connectPrinter();
    disconnectPrinter();
    return { success: true, message: "Impresora conectada exitosamente" };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const imprimirPrueba = async () => {
  const config = await prisma.configuracion.findFirst();
  const modoImpresion = config?.modoImpresion ?? "simulacion";

  const testData = {
    fecha: new Date(),
    items: [
      { cantidad: 1, nombre: "PRUEBA DE IMPRESIÓN", nota: "Ticket de prueba del sistema" },
      { cantidad: 1, nombre: "Línea 2", nota: "Verificar corte de papel" },
      { cantidad: 1, nombre: "Línea 3", nota: "Verificar calidad de impresión" },
    ],
    total: 0,
  };

  if (modoImpresion === "simulacion") {
    const { generarPDFComanda } = await import("../../utils/pdfGenerator.js");
    const pdfUrl = await generarPDFComanda(testData);
    return { success: true, simulated: true, pdfUrl, message: "Prueba simulada generada" };
  }

  try {
    await connectPrinter();
    const { printCocina } = await import("../../utils/printer.js");
    await printCocina(testData);
    disconnectPrinter();
    return { success: true, message: "Prueba impresa correctamente" };
  } catch (err) {
    try { disconnectPrinter(); } catch {}
    return { success: false, error: err.message };
  }
};
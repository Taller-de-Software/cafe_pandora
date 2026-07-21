import prisma from "../../config/db.config.js";
import { getNetworkDiagnostics } from "../../config/network.js";
import { smartConnect, getConfig, getLastError } from "../../services/printer/index.js";

export const obtenerDiagnosticoCompleto = async () => {
  const network = await getNetworkDiagnostics();

  const dbStart = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbLatency = Date.now() - dbStart;

  const config = await getConfig();
  const modoImpresion = config?.modoImpresion ?? "simulacion";

  let printer = { connected: false, error: null };

  if (modoImpresion === "real") {
    let connection;
    try {
      connection = await smartConnect();
      await connection.adapter.disconnect();
      printer = { connected: true, method: connection.method };
    } catch (err) {
      printer = {
        connected: false,
        error: err.message,
      };
    }
  } else {
    printer = { connected: true, simulated: true };
  }

  const ultimoErrorImpresora = getLastError();

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
      ultimoError: ultimoErrorImpresora,
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
  const config = await getConfig();
  const modoImpresion = config?.modoImpresion ?? "simulacion";

  if (modoImpresion === "simulacion") {
    return {
      success: true,
      simulated: true,
      message: "Modo simulación activo - prueba exitosa",
    };
  }

  const { testConnection } = await import("../../services/printer/index.js");
  const result = await testConnection();
  return result;
};

export const imprimirPrueba = async () => {
  const config = await getConfig();
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
    const { printCocina: newPrintCocina } = await import("../../services/printer/index.js");
    const impreso = await newPrintCocina({
      pedidoId: 'TEST',
      mesa: 'PRUEBA',
      mozo: 'Sistema',
      items: [
        { quantity: 1, name: 'PRUEBA DE IMPRESIÓN', note: 'Ticket de prueba del sistema' },
        { quantity: 1, name: 'Línea 2', note: 'Verificar corte de papel' },
        { quantity: 1, name: 'Línea 3', note: 'Verificar calidad de impresión' },
      ],
    });

    if (!impreso) {
      const ultimoError = getLastError();
      return {
        success: false,
        error: ultimoError?.message || "No se pudo imprimir el ticket de prueba.",
        codigo: ultimoError?.code,
        sugerencia: ultimoError?.suggestion,
      };
    }

    return { success: true, message: "Prueba impresa correctamente" };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      codigo: err.codigo,
      sugerencia: err.sugerencia,
      detalleTecnico: err.detalleTecnico,
    };
  }
};
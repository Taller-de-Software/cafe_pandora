import os from "os";
import {
  getNetworkInterfaces,
  getNetworkDiagnostics,
  buildClientUrls,
  generateQrCodeData,
  testPortAccessibility,
  getBindAddress,
  getServerPort,
} from "../../config/network.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const obtenerInterfaces = async () => {
  return await getNetworkInterfaces();
};

export const obtenerUrlsConexion = async () => {
  const interfaces = await getNetworkInterfaces();
  const port = getServerPort();
  return buildClientUrls(interfaces, port);
};

export const obtenerQrCodes = async () => {
  const port = getServerPort();
  return await generateQrCodeData(port);
};

export const obtenerDiagnostico = async () => {
  return await getNetworkDiagnostics();
};

export const probarPuerto = async (host, port) => {
  if (!host || !port) {
    throw crearError(400, "host y port son requeridos");
  }
  return await testPortAccessibility(host, port);
};

export const obtenerConfiguracionRed = async () => {
  const interfaces = await getNetworkInterfaces();
  const port = getServerPort();
  const bindAddress = getBindAddress();
  return {
    bindAddress,
    port,
    interfaces: interfaces.filter((i) => !i.internal),
    urls: buildClientUrls(interfaces, port),
  };
};

export const obtenerNetworkInfo = async () => {
  const hostname = os.hostname();
  const interfaces = await getNetworkInterfaces();
  const preferred = interfaces.find((i) => i.preferred);
  const port = getServerPort();
  const ip = preferred?.address || "0.0.0.0";
  return {
    hostname,
    ip,
    port,
    url: `http://${ip}:${port}`,
    interfaces: interfaces.filter((i) => !i.internal).map((i) => ({
      name: i.name,
      address: i.address,
      preferred: i.preferred,
    })),
  };
};

export const obtenerDiagnosticoDetallado = async () => {
  const network = await getNetworkDiagnostics();
  const port = getServerPort();
  const preferred = network.interfaces.find((i) => i.preferred);
  const ip = preferred?.address || "0.0.0.0";

  const serverCheck = await testPortAccessibility(ip, port);

  let apiCheck = { ok: false, latency: 0 };
  try {
    const start = Date.now();
    const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    apiCheck = { ok: res.ok, latency: Date.now() - start };
  } catch {
    apiCheck = { ok: false, latency: 0 };
  }

  let socketInfo = { clients: 0, rooms: [] };
  if (global.io) {
    let clients = 0;
    for (const [, ] of global.io.sockets.sockets) clients++;
    socketInfo = {
      clients,
      rooms: Array.from(global.io.sockets.adapter.rooms.keys()),
    };
  }

  let dbCheck = { ok: false, latency: 0 };
  try {
    const prisma = (await import("../../config/db.config.js")).default;
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbCheck = { ok: true, latency: Date.now() - start };
  } catch {
    dbCheck = { ok: false, latency: 0 };
  }

  let printerCheck = { connected: false, mode: "unknown", error: null };
  try {
    const prisma = (await import("../../config/db.config.js")).default;
    const config = await prisma.configuracion.findFirst();
    const mode = config?.modoImpresion ?? "simulacion";
    printerCheck.mode = mode;

    if (mode === "real") {
      try {
        const { connectPrinter, disconnectPrinter } = await import("../../utils/printer.js");
        await connectPrinter();
        printerCheck.connected = true;
        disconnectPrinter();
      } catch (err) {
        printerCheck.connected = false;
        printerCheck.error = err.message;
      }
    } else {
      printerCheck.connected = true;
    }
  } catch {
    printerCheck = { connected: false, mode: "error", error: "No se pudo leer configuración" };
  }

  return {
    timestamp: new Date().toISOString(),
    servidor: {
      hostname: os.hostname(),
      ip,
      port,
      serverAccessible: serverCheck,
    },
    api: apiCheck,
    socket: socketInfo,
    baseDeDatos: dbCheck,
    impresora: printerCheck,
    red: {
      internet: network.internetConnected,
      dns: network.dnsWorking,
      gateway: network.gateway,
      gatewayReachable: network.gatewayReachable,
      interfaces: network.interfaces.map((i) => ({
        name: i.name,
        address: i.address,
        preferred: i.preferred,
        reachable: i.reachable,
      })),
    },
  };
};
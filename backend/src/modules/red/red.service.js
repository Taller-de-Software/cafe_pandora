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
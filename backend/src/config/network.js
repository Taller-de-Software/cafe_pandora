import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import prisma from "./db.config.js";

const execAsync = promisify(exec);

let cachedConfig = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 30000;

async function getConfig() {
  const now = Date.now();
  if (cachedConfig && now - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  const config = await prisma.configuracion.findFirst();
  cachedConfig = config;
  configCacheTime = now;
  return config;
}

export function getBindAddress() {
  return getConfigSync()?.serverHost ?? "0.0.0.0";
}

function getConfigSync() {
  if (cachedConfig && Date.now() - configCacheTime < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  return null;
}

export function getServerPort() {
  return getConfigSync()?.serverPort ?? 3001;
}

function getNetworkInterfacesSync() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4") {
        results.push({ ...net, name });
      }
    }
  }
  return results;
}

async function checkReachability(host) {
  try {
    const { stdout } = await execAsync(`ping -c 1 -W 1 ${host}`, { timeout: 2000 });
    return stdout.includes("1 received") || stdout.includes("1 packets received");
  } catch {
    return false;
  }
}

async function checkInternetConnectivity() {
  try {
    const { stdout } = await execAsync(`ping -c 1 -W 2 8.8.8.8`, { timeout: 3000 });
    return stdout.includes("1 received");
  } catch {
    return false;
  }
}

async function checkDns() {
  try {
    const { stdout } = await execAsync(`nslookup google.com 8.8.8.8`, { timeout: 3000 });
    return stdout.includes("Name:") || stdout.includes("name =");
  } catch {
    return false;
  }
}

async function getDefaultGateway() {
  try {
    const { stdout } = await execAsync(`ip route show default`, { timeout: 2000 });
    const match = stdout.match(/default via (\S+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export async function getNetworkInterfaces() {
  const interfaces = getNetworkInterfacesSync();
  const gateway = await getDefaultGateway();
  const internet = await checkInternetConnectivity();

  const results = [];

  for (const iface of interfaces) {
    const reachable = iface.internal
      ? true
      : gateway
        ? await checkReachability(gateway)
        : false;

    results.push({
      name: iface.name,
      address: iface.address,
      netmask: iface.netmask,
      family: "IPv4",
      internal: iface.internal,
      mac: iface.mac,
      reachable,
      internet,
      preferred: false,
    });
  }

  const nonInternal = results.filter((i) => !i.internal && i.reachable);
  if (nonInternal.length > 0) {
    const preferred =
      nonInternal.find((i) => i.name.startsWith("eth") || i.name.startsWith("en")) ||
      nonInternal[0];
    preferred.preferred = true;
  } else if (results.length > 0) {
    results[0].preferred = true;
  }

  return results;
}

export async function getNetworkDiagnostics() {
  const interfaces = await getNetworkInterfaces();
  const port = getServerPort();
  const bindAddress = getBindAddress();
  const clientUrls = buildClientUrls(interfaces, port);
  const internetConnected = interfaces.some((i) => i.internet);
  const dnsWorking = await checkDns();
  const gateway = await getDefaultGateway();
  const gatewayReachable = gateway ? await checkReachability(gateway) : false;

  return {
    timestamp: new Date().toISOString(),
    interfaces,
    clientUrls,
    internetConnected,
    dnsWorking,
    gatewayReachable,
    bindAddress,
    port,
    gateway,
  };
}

export function buildClientUrls(interfaces, port) {
  return interfaces
    .filter((i) => !i.internal)
    .map((i) => ({
      interfaceName: i.name,
      interfaceAddress: i.address,
      fullUrl: `http://${i.address}:${port}`,
      apiUrl: `http://${i.address}:${port}/api`,
      socketUrl: `http://${i.address}:${port}`,
    }));
}

export async function generateQrCodeData(port) {
  const interfaces = await getNetworkInterfaces();
  const urls = buildClientUrls(interfaces, port);
  return urls.map((u) => `${u.interfaceName}: ${u.apiUrl}`);
}

export async function testPortAccessibility(host, port) {
  return new Promise((resolve) => {
    import("net").then((net) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      socket.once("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.once("error", () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  });
}

export function invalidateConfigCache() {
  cachedConfig = null;
  configCacheTime = 0;
}
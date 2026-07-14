const STORAGE_KEYS = {
  API_URL: 'cafePandora_apiUrl',
  SOCKET_URL: 'cafePandora_socketUrl',
} as const

const DEFAULT_API_URL = 'http://localhost:3001/api'
const DEFAULT_SOCKET_URL = 'http://localhost:3001'

export interface ServerConfig {
  apiUrl: string
  socketUrl: string
}

export function getApiUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || DEFAULT_API_URL
}

export function getSocketUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.SOCKET_URL) || DEFAULT_SOCKET_URL
}

export function getServerConfig(): ServerConfig {
  return {
    apiUrl: getApiUrl(),
    socketUrl: getSocketUrl(),
  }
}

export function setServerConfig(config: ServerConfig): void {
  localStorage.setItem(STORAGE_KEYS.API_URL, config.apiUrl)
  localStorage.setItem(STORAGE_KEYS.SOCKET_URL, config.socketUrl)
}

export function resetServerConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.API_URL)
  localStorage.removeItem(STORAGE_KEYS.SOCKET_URL)
}

export function isCustomConfig(): boolean {
  return localStorage.getItem(STORAGE_KEYS.API_URL) !== null
}

export function buildServerConfig(ip: string, port: string): ServerConfig {
  const host = ip.trim()
  const prt = port.trim() || '3001'
  return {
    apiUrl: `http://${host}:${prt}/api`,
    socketUrl: `http://${host}:${prt}`,
  }
}

export async function testConnection(url: string): Promise<{ ok: boolean; message: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${url}/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      return { ok: true, message: 'Conexión exitosa con el servidor' }
    }
    return { ok: false, message: `El servidor respondió con error ${res.status}` }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, message: 'La conexión tardó demasiado (5s timeout)' }
    }
    return { ok: false, message: 'No se pudo conectar al servidor. Verifica la IP y el puerto.' }
  }
}

export function getBaseUrl(): string {
  return getApiUrl().replace('/api', '')
}

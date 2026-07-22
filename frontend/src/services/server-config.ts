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

function getDetectedHostname(): string | null {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname
    }
  }
  return null
}

function getDefaultProtocol(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return 'https'
  }
  return 'http'
}

export function autoDetectApiUrl(): string {
  const hostname = getDetectedHostname()
  if (hostname) {
    const protocol = getDefaultProtocol()
    return `${protocol}://${hostname}:3001/api`
  }
  return DEFAULT_API_URL
}

export function autoDetectSocketUrl(): string {
  const hostname = getDetectedHostname()
  if (hostname) {
    const protocol = getDefaultProtocol()
    return `${protocol}://${hostname}:3001`
  }
  return DEFAULT_SOCKET_URL
}

export function getApiUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || autoDetectApiUrl()
}

export function getSocketUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.SOCKET_URL) || autoDetectSocketUrl()
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
  const protocol = getDefaultProtocol()
  return {
    apiUrl: `${protocol}://${host}:${prt}/api`,
    socketUrl: `${protocol}://${host}:${prt}`,
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

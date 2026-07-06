import { storage } from './storage'

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

let refreshPromise: Promise<boolean> | null = null

async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise
  refreshPromise = doRefreshTokens()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function doRefreshTokens(): Promise<boolean> {
  const refresh = storage.getRefreshToken()
  if (!refresh) return false
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: refresh }),
  })
  if (!res.ok) return false
  const text = await res.text()
  if (!text) return false
  let json: ApiResponse<{ accessToken: string; refreshToken: string }>
  try {
    json = JSON.parse(text)
  } catch {
    return false
  }
  storage.setAccessToken(json.data.accessToken)
  storage.setRefreshToken(json.data.refreshToken)
  return true
}

const REQUEST_TIMEOUT = 15000

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getAccessToken()
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
      signal: controller.signal,
    })

    if (res.status === 401 && storage.getRefreshToken()) {
      const ok = await refreshTokens()
      if (ok) return request<T>(path, options)
      storage.clear()
      window.location.href = '/'
      throw new Error('401 Sesión expirada')
    }

    const text = await res.text()
    if (!text) {
      throw new Error(`${res.status} El servidor devolvió una respuesta vacía`)
    }
    let json: ApiResponse<T>
    try {
      json = JSON.parse(text)
    } catch {
      throw new Error(`${res.status} Respuesta inválida del servidor`)
    }
    if (!res.ok) {
      throw new Error(`${res.status} ${json.message || 'Error de servidor'}`)
    }
    return json.data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado en responder', { cause: err })
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  postFormData: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),
  putFormData: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'PUT', body }),
}

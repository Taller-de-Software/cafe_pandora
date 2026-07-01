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
  const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json()
  storage.setAccessToken(json.data.accessToken)
  storage.setRefreshToken(json.data.refreshToken)
  return true
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getAccessToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401 && storage.getRefreshToken()) {
    const ok = await refreshTokens()
    if (ok) return request<T>(path, options)
    storage.clear()
    window.location.href = '/'
    throw new Error('Sesión expirada')
  }

  const json: ApiResponse<T> = await res.json()
  if (!res.ok) throw new Error(json.message || 'Error de servidor')
  return json.data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

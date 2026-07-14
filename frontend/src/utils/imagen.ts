import { getBaseUrl } from '@/services/server-config'

const BASE = getBaseUrl()

export function imagenUrlCompleta(imagenUrl?: string): string | null {
  if (!imagenUrl) return null
  if (imagenUrl.startsWith('http') || imagenUrl.startsWith('blob:')) return imagenUrl
  return `${BASE}/uploads/productos/${encodeURIComponent(imagenUrl)}`
}
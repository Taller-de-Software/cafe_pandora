import { getBaseUrl } from '@/services/server-config'

export function imagenUrlCompleta(imagenUrl?: string): string | null {
  if (!imagenUrl) return null
  if (imagenUrl.startsWith('http') || imagenUrl.startsWith('blob:')) return imagenUrl
  if (imagenUrl.startsWith('/')) return `${getBaseUrl()}${imagenUrl}`
  return `${getBaseUrl()}/uploads/productos/${encodeURIComponent(imagenUrl)}`
}
import { api } from '@/services/api'
import { getApiUrl } from '@/services/server-config'
import { storage } from '@/services/storage'

export interface MetodoPago {
  id: number
  nombre: string
  entidad?: string
}

export interface CrearFacturaData {
  pedidoId: number
  subtotal: number
  impuestoConsumo: number
  propina: number
  total: number
  metodoPagoId: number
  cajaSesionId: number
}

export interface Factura {
  id: number
  pedidoId: number
  subtotal: number
  impuestoConsumo: number
  propina: number
  total: number
  metodoPagoId: number
  cajaSesionId: number
  creadoEn: string
  metodoPago: MetodoPago
}

export async function listarMetodosPago(): Promise<MetodoPago[]> {
  return api.get<MetodoPago[]>('/metodos-pago')
}

export async function crearFactura(data: CrearFacturaData): Promise<Factura> {
  return api.post<Factura>('/facturas', data)
}

export async function obtenerSesionCajaActiva(): Promise<{ id: number } | null> {
  return api.get<{ id: number } | null>('/caja/activa')
}

export async function imprimirFactura(facturaId: number): Promise<{ pdfUrl?: string; message: string }> {
  return api.post<{ pdfUrl?: string; message: string }>(`/impresion/pago/${facturaId}`)
}

export async function obtenerComprobante(facturaId: number): Promise<{ pdfUrl?: string; message?: string }> {
  return api.get<{ pdfUrl?: string; message?: string }>(`/facturas/${facturaId}/comprobante`)
}

export async function comprobanteDisponible(facturaId: number): Promise<{ disponible: boolean; modo: 'simulacion' | 'real' }> {
  return api.get<{ disponible: boolean; modo: 'simulacion' | 'real' }>(`/facturas/${facturaId}/comprobante-disponible`)
}

export async function descargarComprobante(facturaId: number): Promise<string> {
  const token = storage.getAccessToken()
  const res = await fetch(`${getApiUrl()}/facturas/${facturaId}/comprobante-archivo`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = 'No se pudo descargar el comprobante'
    try {
      const json = JSON.parse(text)
      msg = json.message || msg
    } catch { /* empty */ }
    throw new Error(msg)
  }
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

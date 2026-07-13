import { api } from '@/services/api'

export interface MetodoPago {
  id: number
  nombre: string
  entidad?: string
}

export interface CrearFacturaData {
  pedidoId: number
  subtotal: number
  impuestoConsumo: number
  total: number
  metodoPagoId: number
  cajaSesionId: number
}

export interface Factura {
  id: number
  pedidoId: number
  subtotal: number
  impuestoConsumo: number
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

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

export async function imprimirFactura(facturaId: number): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/impresion/pago/${facturaId}`)
}

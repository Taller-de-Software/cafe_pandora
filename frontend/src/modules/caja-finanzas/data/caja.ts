import { api } from '@/services/api'

export interface Retiro {
  id: number
  tipo: 'entrada' | 'salida'
  monto: number
  retiradoEn: string
  cajaSesionId: number
}

export interface CajaSesion {
  id: number
  baseInicial: number
  totalVentas: number
  totalEgresos: number
  totalEnCaja: number
  netoCajon: number
  apertura: string
  cierre: string | null
  retiros?: Retiro[]
}

export async function obtenerSesionActiva(): Promise<CajaSesion | null> {
  return api.get<CajaSesion | null>('/caja/activa')
}

export async function listarSesiones(): Promise<CajaSesion[]> {
  return api.get<CajaSesion[]>('/caja')
}

export async function apertura(baseInicial: number): Promise<CajaSesion> {
  return api.post<CajaSesion>('/caja/apertura', { baseInicial })
}

export async function cierre(id: number): Promise<CajaSesion> {
  return api.post<CajaSesion>(`/caja/${id}/cierre`)
}

export async function listarRetiros(cajaSesionId: number): Promise<Retiro[]> {
  return api.get<Retiro[]>(`/caja/${cajaSesionId}/retiros`)
}

export async function crearRetiro(cajaSesionId: number, data: { tipo: 'entrada' | 'salida'; monto: number }): Promise<Retiro> {
  return api.post<Retiro>(`/caja/${cajaSesionId}/retiros`, data)
}

export interface ResumenCajaSesion {
  id: number
  apertura: string
  cierre: string | null
  baseInicial: number
  totalVentas: number
  totalEgresos: number
  totalEnCaja: number
  netoCajon: number
  estaAbierta: boolean
}

export interface DesgloseMetodoPago {
  count: number
  total: number
}

export interface ResumenCajaData {
  cantidadFacturas: number
  sumaTotal: number
  desglosePorMetodoPago: Record<string, DesgloseMetodoPago>
  totalEntradasRetiros: number
  totalSalidasRetiros: number
  balanceEsperado: number
}

export interface ResumenFactura {
  id: number
  total: number
  subtotal: number
  impuestoConsumo: number
  creadoEn: string
  metodoPago: string
  pedido: {
    id: number
    mesa: string
    estado: string
    detalles: {
      producto: string
      cantidad: number
      precio: number
    }[]
  }
}

export interface ResumenCaja {
  sesion: ResumenCajaSesion
  resumen: ResumenCajaData
  facturas: ResumenFactura[]
  retiros: Retiro[]
}

export async function obtenerResumenCaja(id: number): Promise<ResumenCaja> {
  return api.get<ResumenCaja>(`/caja/${id}/resumen`)
}

import { api } from '@/services/api'

export interface VentaResumen {
  total: number
  cantidadPedidos: number
}

export interface VentaDetalle {
  id: number
  total: number
  mesa: string
  estado: string
  creadoEn: string
  detalles: {
    producto: string
    cantidad: number
    precio: number
  }[]
}

export interface VentasResponse {
  resumen: VentaResumen
  pedidos: VentaDetalle[]
}

export async function obtenerVentasDia(): Promise<VentasResponse> {
  console.log("esta en el apartado de venta del dia")
  return api.get<VentasResponse>('/ventas/dia')
}

export async function obtenerVentasSemana(): Promise<VentasResponse> {
  return api.get<VentasResponse>('/ventas/semana')
}

export async function obtenerVentasMes(): Promise<VentasResponse> {
  return api.get<VentasResponse>('/ventas/mes')
}

import { api } from '@/services/api'

export interface VentaResumen {
  total: number
  cantidadPedidos: number
  ticketPromedio: number
  itemsVendidos: number
}

export interface VentaCategoria {
  categoria: string
  total: number
  cantidad: number
}

export interface ProductoVendido {
  producto: string
  cantidad: number
  total: number
}

export interface VentaDetalle {
  id: number
  total: number
  mesa: string
  metodoPago: string
  estado: string
  fechaPago: string | null
  detalles: {
    producto: string
    cantidad: number
    precio: number
  }[]
}

export interface VentasResponse {
  resumen: VentaResumen
  porCategoria: VentaCategoria[]
  productosMasVendidos: ProductoVendido[]
  pedidos: VentaDetalle[]
}

export async function obtenerVentasDia(): Promise<VentasResponse> {
  return api.get<VentasResponse>('/ventas/dia')
}

export async function obtenerVentasSemana(): Promise<VentasResponse> {
  return api.get<VentasResponse>('/ventas/semana')
}

export async function obtenerVentasMes(): Promise<VentasResponse> {
  return api.get<VentasResponse>('/ventas/mes')
}

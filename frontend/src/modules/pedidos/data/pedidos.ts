import { api } from '@/services/api'
import type { MetodoPago } from '@/types/metodo-pago'

export type EstadoPedido = 'recibido' | 'pendiente' | 'hecho' | 'finalizado' | 'cancelado'

export interface DetallePedido {
  id: number
  cantidad: number
  precioUnitario: number
  notas?: string
  productoId: number
  producto: { id: number; nombre: string; precio: number; requierePreparacion?: boolean }
}

export interface AbonoPedido {
  id: number
  monto: number
  metodoPagoId: number
  pedidoId: number
  creadoEn: string
}

export interface Pedido {
  id: number
  turno: number
  estado: EstadoPedido
  total?: number
  totalAbonado?: number
  nombreCliente: string
  mesaId: number
  mesa: { id: number; nombre: string; ubicacion?: string }
  usuario: { id: number; nombre?: string; rol: string }
  detalles: DetallePedido[]
  factura?: { id: number } | null
  abonos?: AbonoPedido[]
  creadoEn: string
}

export interface Mesa {
  id: number
  nombre: string
  ubicacion: string
  estado: string
}

export async function listarPedidos(filters?: { estado?: string; mesaId?: number }): Promise<Pedido[]> {
  const params = new URLSearchParams()
  if (filters?.estado) params.set('estado', filters.estado)
  if (filters?.mesaId) params.set('mesaId', String(filters.mesaId))
  const query = params.toString() ? `?${params.toString()}` : ''
  return api.get<Pedido[]>(`/pedidos${query}`)
}

export async function obtenerPedido(id: number): Promise<Pedido> {
  return api.get<Pedido>(`/pedidos/${id}`)
}

export async function crearPedido(data: {
  mesaId: number
  turno?: number
  nombreCliente: string
  items: { productoId: number; cantidad: number; notas?: string }[]
}): Promise<Pedido> {
  return api.post<Pedido>('/pedidos', data)
}

export async function cambiarEstado(id: number, estado: EstadoPedido): Promise<Pedido> {
  return api.put<Pedido>(`/pedidos/${id}/estado`, { estado })
}

export async function cancelarPedido(id: number): Promise<Pedido> {
  return api.post<Pedido>(`/pedidos/${id}/cancelar`)
}

export async function actualizarItemsPedido(id: number, items: { productoId: number; cantidad: number; notas?: string }[], nuevoEstado?: string): Promise<Pedido> {
  return api.patch<Pedido>(`/pedidos/${id}/items`, { items, nuevoEstado })
}

export async function separarCuentaPedido(id: number, cuentas: { productoId: number; cantidad: number; precioUnitario: number; notas?: string }[][]): Promise<{ original: Pedido; nuevosPedidos: Pedido[] }> {
  return api.post(`/pedidos/${id}/separar`, { cuentas })
}

export async function unirMesasPedido(id: number, mesaOrigenId: number): Promise<Pedido> {
  return api.post<Pedido>(`/pedidos/${id}/unir`, { mesaOrigenId })
}

export async function cambiarMesaPedido(id: number, mesaId: number): Promise<Pedido> {
  return api.put<Pedido>(`/pedidos/${id}/mesa`, { mesaId })
}

export async function registrarAbonoPedido(id: number, data: { monto: number; metodoPagoId: number }): Promise<{ abono: AbonoPedido; pedido: Pedido }> {
  return api.post(`/pedidos/${id}/abono`, data)
}

export async function imprimirCocina(pedidoId: number): Promise<{ pdfUrl?: string; message: string }> {
  return api.post<{ pdfUrl?: string; message: string }>(`/impresion/cocina/${pedidoId}`)
}

export async function listarMesas(): Promise<Mesa[]> {
  return api.get<Mesa[]>('/mesas')
}

export async function listarMetodosPago(): Promise<MetodoPago[]> {
  return api.get<MetodoPago[]>('/metodos-pago')
}

export async function listarProductos(): Promise<{ id: number; nombre: string; precio: number }[]> {
  return api.get('/menu/productos')
}

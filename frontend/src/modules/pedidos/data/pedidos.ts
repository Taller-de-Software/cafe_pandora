import { api } from '@/services/api'

export type EstadoPedido = 'recibido' | 'pendiente' | 'hecho' | 'finalizado' | 'cancelado'

export interface DetallePedido {
  id: number
  cantidad: number
  precioUnitario: number
  notas?: string
  productoId: number
  producto: { id: number; nombre: string; precio: number }
}

export interface Pedido {
  id: number
  turno: number
  estado: EstadoPedido
  total?: number
  mesaId: number
  mesa: { id: number; nombre: string }
  usuario: { id: number; rol: string }
  detalles: DetallePedido[]
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
  turno: number
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

export async function imprimirCocina(pedidoId: number): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/impresion/cocina/${pedidoId}`)
}

export async function listarMesas(): Promise<Mesa[]> {
  return api.get<Mesa[]>('/mesas')
}

export async function listarProductos(): Promise<{ id: number; nombre: string; precio: number }[]> {
  return api.get('/menu/productos')
}

export async function imprimirReciboCocina(id: string): Promise<void> {
  return api.post(`/pedidos/${id}/recibo-cocina`)
}

import { api } from '@/services/api'
import type { DetallePedido, Pedido } from '@modules/pedidos/data/pedidos'
import type { Producto } from '@modules/menu/api/productos'

export type EstadoMesa = 'vacia' | 'ocupada' | 'por_pagar' | 'reservada' | 'fuera_de_servicio'

export interface Reserva {
  id: number
  cliente: string
  telefono?: string
  fecha: string
  hora: string
  personas: number
  observaciones?: string
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
  mesaId: number
  mesa?: { id: number; nombre: string; ubicacion: string }
}

export interface MesaCompleta {
  id: number
  nombre: string
  ubicacion: string
  estado: EstadoMesa
  personalizada: boolean
  capacidad: number
  pedidoActivo: (Pedido & { detalles: DetallePedido[] }) | null
  reserva: Reserva | null
}

export interface ItemCarrito {
  productoId: number
  producto: Producto
  cantidad: number
  notas: string
}

export async function listarMesasCompletas(): Promise<MesaCompleta[]> {
  return api.get<MesaCompleta[]>('/mesas')
}

export async function obtenerMesa(id: number): Promise<MesaCompleta> {
  return api.get<MesaCompleta>(`/mesas/${id}`)
}

export async function listarReservas(params?: {
  mesaId?: number
  fecha?: string
  estado?: string
}): Promise<Reserva[]> {
  const searchParams = new URLSearchParams()
  if (params?.mesaId) searchParams.set('mesaId', String(params.mesaId))
  if (params?.fecha) searchParams.set('fecha', params.fecha)
  if (params?.estado) searchParams.set('estado', params.estado)
  const qs = searchParams.toString()
  return api.get<Reserva[]>(`/reservas${qs ? `?${qs}` : ''}`)
}

export async function crearReserva(data: {
  cliente: string
  telefono?: string
  fecha: string
  hora: string
  personas: number
  observaciones?: string
  mesaId: number
}): Promise<Reserva> {
  return api.post<Reserva>('/reservas', data)
}

export async function actualizarReserva(
  id: number,
  data: {
    cliente?: string
    telefono?: string
    fecha?: string
    hora?: string
    personas?: number
    observaciones?: string
  }
): Promise<Reserva> {
  return api.put<Reserva>(`/reservas/${id}`, data)
}

export async function cancelarReserva(id: number): Promise<Reserva> {
  return api.post<Reserva>(`/reservas/${id}/cancelar`)
}

export async function convertirReserva(id: number, turno: number): Promise<Pedido> {
  return api.post<Pedido>(`/reservas/${id}/convertir`, { turno })
}

export async function listarCategorias(): Promise<{ id: number; nombre: string }[]> {
  return api.get('/menu/categorias')
}

export async function listarProductosHabilitados(): Promise<Producto[]> {
  return api.get<Producto[]>('/menu/productos')
}

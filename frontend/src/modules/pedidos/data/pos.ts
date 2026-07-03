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
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
  mesaId: number
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

export async function crearReserva(data: {
  cliente: string
  telefono?: string
  fecha: string
  hora: string
  personas: number
  mesaId: number
}): Promise<Reserva> {
  return api.post<Reserva>('/reservas', data)
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

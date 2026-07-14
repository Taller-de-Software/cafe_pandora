import type { EstadoPedido } from '../data/pedidos'

export interface EstadoPedidoMapa {
  className: string
  label: string
}

export const ESTADO_PEDIDO_MAPA: Record<EstadoPedido, EstadoPedidoMapa> = {
  recibido: { className: 'badge-recibido', label: 'RECIBIDO' },
  pendiente: { className: 'badge-pendiente', label: 'PENDIENTE' },
  hecho: { className: 'badge-hecho', label: 'HECHO' },
  finalizado: { className: 'badge-finalizado', label: 'FINALIZADO' },
  cancelado: { className: 'badge-cancelado', label: 'CANCELADO' },
}

export function getEstadoPedidoClass(estado: EstadoPedido): string {
  return ESTADO_PEDIDO_MAPA[estado]?.className ?? 'badge-pendiente'
}

export function getEstadoPedidoLabel(estado: EstadoPedido): string {
  return ESTADO_PEDIDO_MAPA[estado]?.label ?? estado.toUpperCase()
}
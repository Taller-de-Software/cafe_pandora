import type { Pedido, DetallePedido } from '../data/pedidos'

export function formatPrecio(valor: number | undefined): string {
  if (valor == null || isNaN(valor)) return '—'
  const entero = Math.floor(valor)
  const decimal = Math.round((valor - entero) * 10)
  return decimal > 0 ? `${entero},${decimal}` : `${entero}`
}

export function getMesaNumero(p: Pedido): string {
  return String(p.mesaId ?? '')
}

export function getMesaNombre(p: Pedido): string {
  return p.mesa?.nombre ?? ''
}

export function getComandaId(p: Pedido): string {
  return String(p?.id ?? '')
}

export function getHoraComanda(p: Pedido): string {
  try {
    if (!p.creadoEn) return '—'
    return new Date(p.creadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

export function getMesero(p: Pedido): string {
  return p.usuario?.nombre ?? p.usuario?.rol ?? '—'
}

export interface ProductoRow {
  nombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
  productoId?: number
  requierePreparacion?: boolean
}

export function getProductos(p: Pedido): ProductoRow[] {
  if (!Array.isArray(p.detalles)) return []
  return p.detalles
    .filter((d) => d != null)
    .map((d) => ({
      nombre: d.producto?.nombre ?? 'Producto',
      precioUnitario: d.precioUnitario ?? 0,
      cantidad: d.cantidad ?? 0,
      subtotal: (d.precioUnitario ?? 0) * (d.cantidad ?? 0),
      productoId: d.productoId,
      requierePreparacion: d.producto?.requierePreparacion,
    }))
}
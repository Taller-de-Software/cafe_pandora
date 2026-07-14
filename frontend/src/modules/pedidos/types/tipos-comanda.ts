export interface ItemComanda {
  id: number
  nombre: string
  precio: number
  cantidad: number
  subtotal: number
  notas?: string
}

export interface ProductoRow {
  nombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
  productoId?: number
  requierePreparacion?: boolean
}
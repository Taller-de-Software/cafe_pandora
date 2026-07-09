export interface ItemPedidoPendiente {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface CuentaSeparada {
  productos: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[]
  total: number
}

export interface PedidoPendiente {
  id: string
  mesa: string
  turno: number
  horaCreacion: string
  estado: 'RECIBIDO'
  items: ItemPedidoPendiente[]
  mesero: string
  cuentas?: CuentaSeparada[]
}

export interface ItemPedidoPendiente {
  nombre: string
  cantidad: number
  precioUnitario: number
}

export interface PedidoPendiente {
  id: string
  mesa: string
  mesaNumero: number
  turno: number
  horaCreacion: string
  estado: 'RECIBIDO'
  items: ItemPedidoPendiente[]
  mesero: string
}

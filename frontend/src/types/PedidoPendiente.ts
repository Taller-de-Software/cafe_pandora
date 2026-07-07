export interface ItemPedidoPendiente {
  nombre: string
  cantidad: number
}

export interface PedidoPendiente {
  id: string
  mesa: string
  turno: number
  horaCreacion: string
  estado: 'RECIBIDO'
  items: ItemPedidoPendiente[]
}

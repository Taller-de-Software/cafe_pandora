export type TableType = 'Exterior' | 'Terraza'
export type TableStatus = 'VACÍA' | 'RESERVADA' | 'OCUPADA' | 'POR_PAGAR'

export interface Reservation {
  fecha: string
  hora: string
  nombreCliente?: string
  estado: 'reservada'
}

export interface Table {
  id: string
  name: string
  type: TableType
  status: TableStatus
  reservation?: Reservation
}

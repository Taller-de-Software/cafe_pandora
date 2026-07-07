export type TableType = 'Exterior' | 'Terraza'
export type TableStatus = 'VACÍA' | 'RESERVADA' | 'OCUPADA' | 'POR_PAGAR'

export interface Reservation {
  customerName?: string
  date: string
  time: string
}

export interface Table {
  id: string
  name: string
  type: TableType
  status: TableStatus
  reservation?: Reservation
}

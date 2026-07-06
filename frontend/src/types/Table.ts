export type TableType = 'Exterior' | 'Terraza'
export type TableStatus = 'VACÍA'

export interface Table {
  id: string
  name: string
  type: TableType
  status: TableStatus
}

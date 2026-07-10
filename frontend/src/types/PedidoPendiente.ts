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

export interface Abono {
  monto: number
  metodo: 'Efectivo' | 'Tarjeta' | 'Transferencia'
  hora: string
}

export interface PedidoPendiente {
  id: string
  mesa: string
  turno: number
  horaCreacion: string
  estado: 'RECIBIDO' | 'PENDIENTE' | 'HECHO' | 'FINALIZADO'
  items: ItemPedidoPendiente[]
  mesero: string
  cuentas?: CuentaSeparada[]
  abonos?: Abono[]
  totalAbonado: number
  total: number
  esCuentaSeparada?: boolean
  esFusion?: boolean
}

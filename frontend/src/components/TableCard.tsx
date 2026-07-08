import type { Table } from '@/types/Table'
import { formatearHora } from '@/utils/formatear'
import styles from './TableCard.module.css'

interface TableCardProps {
  table: Table
  onClick?: () => void
}

const statusClass: Record<string, string> = {
  VACÍA: styles.vacia,
  RESERVADA: styles.reservada,
}

function TableCard({ table, onClick }: TableCardProps) {
  const estadoClase = statusClass[table.status] || ''
  const isReserved = table.status === 'RESERVADA' && table.reservation

  return (
    <div className={`${styles.card} ${estadoClase}`} onClick={onClick}>
      <span className={styles.name}>Mesa {table.name} ({table.type})</span>
      <span className={styles.badge}>{table.status}</span>
      {isReserved && (
        <div className={styles.reservationInfo}>
          {table.reservation!.hora && (
            <span className={styles.reservationTime}>{formatearHora(table.reservation!.hora)}</span>
          )}
          {table.reservation!.nombreCliente && (
            <span className={styles.reservationCustomer}>{table.reservation!.nombreCliente}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default TableCard

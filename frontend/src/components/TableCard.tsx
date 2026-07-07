import type { Table } from '@/types/Table'
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

  return (
    <div className={`${styles.card} ${estadoClase}`} onClick={onClick}>
      <span className={styles.name}>Mesa {table.name} ({table.type})</span>
      <span className={styles.badge}>{table.status}</span>
    </div>
  )
}

export default TableCard

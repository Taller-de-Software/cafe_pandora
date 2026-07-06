import type { Table } from '@/types/Table'
import styles from './TableCard.module.css'

interface TableCardProps {
  table: Table
}

function TableCard({ table }: TableCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.name}>{table.name}</span>
      <span className={styles.type}>{table.type}</span>
      <span className={styles.badge}>{table.status}</span>
    </div>
  )
}

export default TableCard

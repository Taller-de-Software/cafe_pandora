import { useState } from 'react'
import AddTableModal from '@/components/modals/AddTableModal'
import ReserveTableModal from '@/components/modals/ReserveTableModal'
import EditReservationModal from '@/components/modals/EditReservationModal'
import TableCard from '@/components/TableCard'
import TomaPedidoView from './TomaPedidoView'
import { useTables } from '@/hooks/useTables'
import type { Table } from '@/types/Table'
import styles from './NuevoPedidoView.module.css'

interface NuevoPedidoViewProps {
  onConfirmarPedido: (mesa: string, items: { nombre: string; cantidad: number }[]) => void
}

function NuevoPedidoView({ onConfirmarPedido }: NuevoPedidoViewProps) {
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false)
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false)
  const [isEditReserveModalOpen, setIsEditReserveModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const { tables, addTable, reserveTable, updateReservation, cancelReservation } = useTables()

  if (selectedTable) {
    return (
      <TomaPedidoView table={selectedTable} onBack={() => setSelectedTable(null)} onConfirmarPedido={onConfirmarPedido} />
    )
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seleccione la Mesa</h2>
        <p className={styles.subtitle}>Elija una mesa del salón o registre una mesa alterna.</p>
      </div>

      <div className={`${styles.mesasContainer} ${tables.length > 0 ? styles.mesasContainerFilled : ''}`}>
        {tables.map((t) => (
          <TableCard key={t.id} table={t} onClick={() => setSelectedTable(t)} />
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>¿No encuentra la mesa? Crea una personalizada o reserva una mesa.</p>
        <div className={styles.buttons}>
          <button className={styles.btnPrimary} onClick={() => setIsAddTableModalOpen(true)}>
            + Agregar Nueva Mesa
          </button>
          <button className={styles.btnSecondary} onClick={() => setIsReserveModalOpen(true)}>
            Reservar una Mesa
          </button>
          <button className={styles.btnSecondary} onClick={() => setIsEditReserveModalOpen(true)}>
            Editar Reserva
          </button>
        </div>
      </div>

      <AddTableModal
        open={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onConfirm={(name, type) => addTable(name, type)}
      />

      <ReserveTableModal
        open={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        tables={tables}
        onReserve={reserveTable}
      />

      <EditReservationModal
        open={isEditReserveModalOpen}
        onClose={() => setIsEditReserveModalOpen(false)}
        tables={tables}
        onUpdateReservation={updateReservation}
        onCancelReservation={cancelReservation}
      />
    </div>
  )
}

export default NuevoPedidoView

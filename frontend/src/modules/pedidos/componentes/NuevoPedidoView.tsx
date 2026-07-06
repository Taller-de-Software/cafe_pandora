import { useState } from 'react'
import AddTableModal from '@/components/modals/AddTableModal'
import TableCard from '@/components/TableCard'
import { useTables } from '@/hooks/useTables'
import styles from './NuevoPedidoView.module.css'

function NuevoPedidoView() {
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false)
  const { tables, addTable } = useTables()

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seleccione la Mesa</h2>
        <p className={styles.subtitle}>Elija una mesa del salón o registre una mesa alterna.</p>
      </div>

      <div className={`${styles.mesasContainer} ${tables.length > 0 ? styles.mesasContainerFilled : ''}`}>
        {tables.map((t) => (
          <TableCard key={t.id} table={t} />
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerText}>¿No encuentra la mesa? Cree una personalizada o reserve.</p>
        <div className={styles.buttons}>
          <button className={styles.btnPrimary} onClick={() => setIsAddTableModalOpen(true)}>
            + Agregar Nueva Mesa
          </button>
          <button className={styles.btnSecondary} onClick={() => {}}>
            Reservar una Mesa
          </button>
        </div>
      </div>

      <AddTableModal
        open={isAddTableModalOpen}
        onClose={() => setIsAddTableModalOpen(false)}
        onConfirm={(name, type) => addTable(name, type)}
      />
    </div>
  )
}

export default NuevoPedidoView

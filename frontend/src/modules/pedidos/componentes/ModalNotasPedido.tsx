import { useState } from 'react'
import styles from './ModalNotasPedido.module.css'

interface NotaItem {
  productoId: number
  nombre: string
  notas: string
}

interface ModalNotasPedidoProps {
  items: NotaItem[]
  onSave: (items: { productoId: number; notas: string }[]) => void
  onClose: () => void
}

function ModalNotasPedido({ items, onSave, onClose }: ModalNotasPedidoProps) {
  const [notas, setNotas] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {}
    for (const item of items) {
      map[item.productoId] = item.notas
    }
    return map
  })

  function handleSave() {
    const result = items.map((item) => ({
      productoId: item.productoId,
      notas: notas[item.productoId] || '',
    }))
    onSave(result)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Notas por producto</h2>
        <p className={styles.subtitle}>Agrega una nota opcional para cada producto.</p>

        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.productoId} className={styles.itemRow}>
              <label className={styles.label}>{item.nombre}</label>
              <textarea
                className={styles.textarea}
                placeholder="Sin nota"
                rows={2}
                value={notas[item.productoId] || ''}
                onChange={(e) =>
                  setNotas((prev) => ({ ...prev, [item.productoId]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveBtn} onClick={handleSave}>
            Guardar Notas
          </button>
        </div>
      </div>
    </div>
  )
}

export default ModalNotasPedido

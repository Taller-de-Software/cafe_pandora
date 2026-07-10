import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useError } from '@/context/ErrorContext'
import styles from './FormularioApertura.module.css'

interface FormularioAperturaProps {
  onSave: (baseInicial: number) => Promise<void>
  onCancel: () => void
}

function FormularioApertura({ onSave, onCancel }: FormularioAperturaProps) {
  const { showError } = useError()
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const val = parseFloat(monto)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    try {
      await onSave(val)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.overlay}
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <h3>Abrir Caja</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Base Inicial</label>
                <input
                  className={styles.input}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Abriendo...' : 'Abrir'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FormularioApertura

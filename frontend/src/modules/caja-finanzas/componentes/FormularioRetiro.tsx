import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useError } from '@/context/ErrorContext'
import { useFormattedInput } from '@/hooks/useFormattedInput'
import styles from './FormularioRetiro.module.css'

interface FormularioRetiroProps {
  onSave: (data: { tipo: 'entrada' | 'salida'; monto: number }) => Promise<void>
  onCancel: () => void
}

function FormularioRetiro({ onSave, onCancel }: FormularioRetiroProps) {
  const { showError, showWarning } = useError()
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const monto = useFormattedInput({ type: 'money' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (monto.numericValue <= 0) {
      showWarning('Ingresa un monto mayor a $0 para registrar el movimiento.')
      return
    }
    setSaving(true)
    try {
      await onSave({ tipo, monto: monto.numericValue })
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
            <h3 className='uppercase'>Nuevo Movimiento</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Tipo</label>
                <select className={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida')}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Monto</label>
                <input className={styles.input} {...monto.inputProps} autoFocus />
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.cancelBtn} uppercase`} onClick={onCancel}>Cancelar</button>
              <button type="submit" className={`${styles.saveBtn} uppercase`} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FormularioRetiro

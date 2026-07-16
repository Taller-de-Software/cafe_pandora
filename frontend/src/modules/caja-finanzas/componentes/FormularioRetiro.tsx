import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useError } from '@/context/ErrorContext'
import { useFormattedInput } from '@/hooks/useFormattedInput'
import ConfirmModal from '@/componentes/ConfirmModal'
import styles from './FormularioRetiro.module.css'

interface FormularioRetiroProps {
  tipo: 'entrada' | 'salida'
  totalEnCaja: number
  onSave: (data: { tipo: 'entrada' | 'salida'; monto: number }) => Promise<void>
  onCancel: () => void
}

function FormularioRetiro({ tipo, totalEnCaja, onSave, onCancel }: FormularioRetiroProps) {
  const { showError, showWarning } = useError()
  const monto = useFormattedInput({ type: 'money' })
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const esEntrada = tipo === 'entrada'
  const titulo = esEntrada ? 'Nueva Entrada' : 'Nuevo Retiro'
  const btnLabel = esEntrada ? 'Registrar Entrada' : 'Registrar Retiro'

  function localValidation(): boolean {
    if (monto.numericValue <= 0) {
      showWarning(`Ingresa un monto mayor a $0 para registrar ${esEntrada ? 'la entrada' : 'el retiro'}.`)
      return false
    }
    if (!esEntrada && monto.numericValue > totalEnCaja) {
      showWarning(`Saldo insuficiente. Disponible: $${totalEnCaja.toFixed(2)}`)
      return false
    }
    return true
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!localValidation()) return
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setShowConfirm(false)
    setSaving(true)
    try {
      await onSave({ tipo, monto: monto.numericValue })
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  const confirmMessage = esEntrada
    ? `¿Registrar entrada de $${monto.numericValue.toFixed(2)}?`
    : `¿Registrar retiro de $${monto.numericValue.toFixed(2)}? Saldo actual: $${totalEnCaja.toFixed(2)}`

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
          <div className={`${styles.modalHeader} ${esEntrada ? styles.headerEntrada : styles.headerSalida}`}>
            <h3 className='uppercase'>{titulo}</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              {!esEntrada && (
                <p className={styles.saldoInfo}>Disponible: <strong>${totalEnCaja.toFixed(2)}</strong></p>
              )}
              <div className={styles.field}>
                <label>Monto</label>
                <input className={styles.input} {...monto.inputProps} autoFocus />
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={`${styles.cancelBtn} uppercase`} onClick={onCancel}>Cancelar</button>
              <button type="submit" className={`${styles.saveBtn} uppercase`} disabled={saving}>
                {saving ? 'Guardando...' : btnLabel}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {showConfirm && (
        <ConfirmModal
          titulo={titulo}
          mensaje={confirmMessage}
          textoConfirmar={esEntrada ? 'Sí, registrar' : 'Sí, retirar'}
          variante={esEntrada ? 'default' : 'danger'}
          onConfirmar={handleConfirm}
          onCancelar={() => setShowConfirm(false)}
        />
      )}
    </AnimatePresence>
  )
}

export default FormularioRetiro

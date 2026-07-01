import { useState, type FormEvent } from 'react'
import styles from './FormularioApertura.module.css'

interface FormularioAperturaProps {
  onSave: (baseInicial: number) => Promise<void>
  onCancel: () => void
}

function FormularioApertura({ onSave, onCancel }: FormularioAperturaProps) {
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const val = parseFloat(monto)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    try {
      await onSave(val)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Abrir Caja</h3>
        <form onSubmit={handleSubmit}>
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
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Abriendo...' : 'Abrir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioApertura

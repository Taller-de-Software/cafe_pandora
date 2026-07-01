import { useState, type FormEvent } from 'react'
import styles from './FormularioRetiro.module.css'

interface FormularioRetiroProps {
  onSave: (data: { tipo: 'entrada' | 'salida'; monto: number }) => Promise<void>
  onCancel: () => void
}

function FormularioRetiro({ onSave, onCancel }: FormularioRetiroProps) {
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada')
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const val = parseFloat(monto)
    if (isNaN(val) || val <= 0) return
    setSaving(true)
    try {
      await onSave({ tipo, monto: val })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo Movimiento</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Tipo</label>
            <select className={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'salida')}>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Monto</label>
            <input className={styles.input} type="number" step="0.01" min="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioRetiro

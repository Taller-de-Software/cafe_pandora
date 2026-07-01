import { useState, type FormEvent } from 'react'
import styles from './FormularioCategoria.module.css'

interface FormularioCategoriaProps {
  onSave: (nombre: string) => Promise<void>
  onCancel: () => void
}

function FormularioCategoria({ onSave, onCancel }: FormularioCategoriaProps) {
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await onSave(nombre.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Nueva Categoría</h3>
        <form onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="Nombre de la categoría"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
          />
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioCategoria

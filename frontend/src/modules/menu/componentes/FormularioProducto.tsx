import { useState, type FormEvent } from 'react'
import { useError } from '@/context/ErrorContext'
import styles from './FormularioProducto.module.css'

interface FormularioProductoProps {
  onSave: (data: {
    nombre: string
    precio: number
    descripcion?: string
    requierePreparacion: boolean
  }) => Promise<void>
  onCancel: () => void
}

function FormularioProducto({ onSave, onCancel }: FormularioProductoProps) {
  const { showError } = useError()
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [requierePreparacion, setRequierePreparacion] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !precio) return
    setSaving(true)
    try {
      await onSave({
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        descripcion: descripcion.trim() || undefined,
        requierePreparacion,
      })
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo Producto</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre</label>
            <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Precio</label>
              <input className={styles.input} type="number" step="0.01" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
          </div>
          <div className={styles.field}>
            <label>Descripción</label>
            <input className={styles.input} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className={styles.checkbox}>
            <input type="checkbox" id="reqPrep" checked={requierePreparacion} onChange={(e) => setRequierePreparacion(e.target.checked)} />
            <label htmlFor="reqPrep">Requiere preparación</label>
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

export default FormularioProducto

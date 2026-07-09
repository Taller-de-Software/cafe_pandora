import { useState, type FormEvent } from 'react'
import type { Categoria } from '../../api/categorias'
import { useError } from '@/context/ErrorContext'
import styles from './FormularioCategoria.module.css'

interface FormularioCategoriaProps {
  categorias: Categoria[]
  onCrear: (nombre: string) => Promise<void>
  onActualizar: (id: number, nombre: string) => Promise<void>
  onEliminar: (id: number) => Promise<void>
  onCerrar: () => void
  embedded?: boolean
}

type Tab = 'crear' | 'editar'

function FormularioCategoria({
  categorias,
  onCrear,
  onActualizar,
  onEliminar,
  onCerrar,
  embedded = false,
}: FormularioCategoriaProps) {
  const { showError } = useError()
  const [tab, setTab] = useState<Tab>('crear')
  const [nombre, setNombre] = useState('')
  const [catId, setCatId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const catSeleccionada = categorias.find((c) => c.id === catId)

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      await onCrear(nombre.trim())
      setNombre('')
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleActualizar() {
    if (!catId || !editNombre.trim()) return
    setSaving(true)
    try {
      await onActualizar(catId, editNombre.trim())
      setCatId(null)
      setEditNombre('')
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id: number) {
    if (deleting === id) return
    setDeleting(id)
    try {
      await onEliminar(id)
      if (catId === id) {
        setCatId(null)
        setEditNombre('')
      }
    } catch (err) {
      showError(err)
    } finally {
      setDeleting(null)
    }
  }

  function seleccionarCat(id: number) {
    setCatId(id)
    const c = categorias.find((cat) => cat.id === id)
    setEditNombre(c?.nombre ?? '')
  }

  const contenido = (
    <>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'crear' ? styles.tabActiva : ''}`}
          onClick={() => setTab('crear')}
        >
          Crear
        </button>
        <button
          className={`${styles.tab} ${tab === 'editar' ? styles.tabActiva : ''}`}
          onClick={() => setTab('editar')}
        >
          Elegir
        </button>
      </div>

      {tab === 'crear' && (
        <form onSubmit={handleCrear} className={styles.form}>
          <label className={styles.label}>Nombre de la categoría</label>
          <input
            className={styles.input}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Bebidas"
            autoFocus
          />
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.btnPrimario}
              disabled={saving || !nombre.trim()}
            >
              {saving ? 'Creando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      {tab === 'editar' && (
        <div className={styles.form}>
          <label className={styles.label}>Seleccionar categoría</label>
          <select
            className={styles.select}
            value={catId ?? ''}
            onChange={(e) => seleccionarCat(Number(e.target.value))}
          >
            <option value="">-- Elegir --</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>

          {catSeleccionada && (
            <div className={styles.accionesCat}>
              <div className={styles.campoActualizar}>
                <label className={styles.label}>Nombre</label>
                <input
                  className={styles.input}
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
              </div>
              <div className={styles.botonesAccion}>
                <button
                  className={styles.btnActualizar}
                  onClick={handleActualizar}
                  disabled={saving || !editNombre.trim()}
                >
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
                <button
                  className={styles.btnEliminar}
                  onClick={() => handleEliminar(catSeleccionada.id)}
                  disabled={deleting === catSeleccionada.id}
                >
                  {deleting === catSeleccionada.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )

  if (embedded) return contenido

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Gestión de Categorías</h3>
          <button className={styles.btnCerrar} onClick={onCerrar}>&times;</button>
        </div>
        {contenido}
      </div>
    </div>
  )
}

export default FormularioCategoria

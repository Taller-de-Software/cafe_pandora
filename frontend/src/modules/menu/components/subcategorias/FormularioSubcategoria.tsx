import { useState, type FormEvent } from 'react'
import type { Subcategoria } from '../../api/subcategorias'
import type { Categoria } from '../../api/categorias'
import { useError } from '@/context/ErrorContext'
import styles from './FormularioSubcategoria.module.css'

interface FormularioSubcategoriaProps {
  subcategorias: Subcategoria[]
  categorias: Categoria[]
  onCrear: (nombre: string, categoriaId: number) => Promise<void>
  onActualizar: (id: number, nombre: string) => Promise<void>
  onEliminar: (id: number) => Promise<void>
  onCambiarCategoria: (id: number, categoriaId: number) => Promise<void>
  onCerrar: () => void
  embedded?: boolean
}

type Tab = 'crear' | 'editar'

function FormularioSubcategoria({
  subcategorias,
  categorias,
  onCrear,
  onActualizar,
  onEliminar,
  onCambiarCategoria,
  onCerrar,
  embedded = false,
}: FormularioSubcategoriaProps) {
  const { showError } = useError()
  const [tab, setTab] = useState<Tab>('crear')
  const [nombre, setNombre] = useState('')
  const [catIdCrear, setCatIdCrear] = useState<number | ''>('')
  const [subId, setSubId] = useState<number | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const [nuevaCatId, setNuevaCatId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const subSeleccionada = subcategorias.find((s) => s.id === subId)

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || catIdCrear === '') return
    setSaving(true)
    try {
      await onCrear(nombre.trim(), Number(catIdCrear))
      setNombre('')
      setCatIdCrear('')
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleActualizar() {
    if (!subId || !editNombre.trim()) return
    setSaving(true)
    try {
      await onActualizar(subId, editNombre.trim())
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id: number) {
    setDeleting(id)
    try {
      await onEliminar(id)
      if (subId === id) {
        setSubId(null)
        setEditNombre('')
      }
    } catch (err) {
      showError(err)
    } finally {
      setDeleting(null)
    }
  }

  async function handleCambiar() {
    if (!subId || nuevaCatId === '') return
    setSaving(true)
    try {
      await onCambiarCategoria(subId, Number(nuevaCatId))
      setNuevaCatId('')
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  function seleccionarSub(id: number) {
    setSubId(id)
    const s = subcategorias.find((sub) => sub.id === id)
    setEditNombre(s?.nombre ?? '')
    setNuevaCatId(s?.categoriaId ?? '')
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
          <div className={styles.campo}>
            <label className={styles.label}>Nombre</label>
            <input
              className={styles.input}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Comidas rápidas"
              autoFocus
            />
          </div>
          <div className={styles.campo}>
            <label className={styles.label}>Categoría</label>
            <select
              className={styles.select}
              value={catIdCrear}
              onChange={(e) => setCatIdCrear(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">-- Seleccionar --</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.btnPrimario}
              disabled={saving || !nombre.trim() || catIdCrear === ''}
            >
              {saving ? 'Creando...' : 'Crear Subcategoría'}
            </button>
          </div>
        </form>
      )}

      {tab === 'editar' && (
        <div className={styles.form}>
          <label className={styles.label}>Seleccionar subcategoría</label>
          <select
            className={styles.select}
            value={subId ?? ''}
            onChange={(e) => seleccionarSub(Number(e.target.value))}
          >
            <option value="">-- Elegir --</option>
            {subcategorias.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>

          {subSeleccionada && (
            <div className={styles.accionesSub}>
              <div className={styles.seccion}>
                <label className={styles.label}>Nombre</label>
                <input
                  className={styles.input}
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                />
                <button
                  className={styles.btnActualizar}
                  onClick={handleActualizar}
                  disabled={saving || !editNombre.trim()}
                >
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>

              <div className={styles.seccion}>
                <label className={styles.label}>Cambiar de categoría</label>
                <select
                  className={styles.select}
                  value={nuevaCatId}
                  onChange={(e) => setNuevaCatId(e.target.value === '' ? '' : Number(e.target.value))}
                >
                  <option value="">-- Seleccionar --</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.btnCambiar}
                  onClick={handleCambiar}
                  disabled={saving || nuevaCatId === '' || nuevaCatId === subSeleccionada.categoriaId}
                >
                  Cambiar
                </button>
              </div>

              <button
                className={styles.btnEliminar}
                onClick={() => handleEliminar(subSeleccionada.id)}
                disabled={deleting === subSeleccionada.id}
              >
                {deleting === subSeleccionada.id ? 'Eliminando...' : 'Eliminar Subcategoría'}
              </button>
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
          <h3>Gestión de Subcategorías</h3>
          <button className={styles.btnCerrar} onClick={onCerrar}>&times;</button>
        </div>
        {contenido}
      </div>
    </div>
  )
}

export default FormularioSubcategoria

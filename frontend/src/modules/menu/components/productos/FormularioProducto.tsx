import { useState, useRef, type FormEvent } from 'react'
import type { Producto } from '../../api/productos'
import type { Categoria } from '../../api/categorias'
import type { Subcategoria } from '../../api/subcategorias'
import { useError } from '@/context/ErrorContext'
import { useFormattedInput } from '@/hooks/useFormattedInput'
import styles from './FormularioProducto.module.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const BASE = API_URL.replace('/api', '')

function imagenUrlCompleta(imagenUrl?: string): string | null {
  if (!imagenUrl) return null
  if (imagenUrl.startsWith('http')) return imagenUrl
  return `${BASE}/${imagenUrl.replace(/^\//, '')}`
}

interface FormularioProductoProps {
  producto?: Producto | null
  categorias: Categoria[]
  subcategorias: Subcategoria[]
  subcategoriasCargando?: boolean
  onGuardar: (formData: FormData) => Promise<void>
  onCerrar: () => void
  embedded?: boolean
}

function FormularioProducto({
  producto,
  categorias,
  subcategorias,
  subcategoriasCargando,
  onGuardar,
  onCerrar,
  embedded = false,
}: FormularioProductoProps) {
  const { showError } = useError()
  const fileRef = useRef<HTMLInputElement>(null)
  const esEdicion = !!producto

  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const precio = useFormattedInput({ type: 'money', initialValue: producto ? String(producto.precio) : '' })
  const [categoriaId, setCategoriaId] = useState<number | ''>(producto?.categoriaId ?? '')
  const [subcategoriaId, setSubcategoriaId] = useState<number | ''>(producto?.subcategoriaId ?? '')
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '')
  const [requierePreparacion, setRequierePreparacion] = useState(producto?.requierePreparacion ?? false)
  const [habilitado, setHabilitado] = useState(producto?.habilitado ?? true)
  const [imagenUrl, setImagenUrl] = useState(producto?.imagenUrl ?? '')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const subcategoriasFiltradas = subcategorias.filter(
    (s) => s.categoriaId === categoriaId
  )

  const previewActual = imagenUrlCompleta(producto?.imagenUrl)

  function handleArchivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
      setArchivoPreview(URL.createObjectURL(file))
      setImagenUrl('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !precio.raw || categoriaId === '') return

    const fd = new FormData()
    fd.append('nombre', nombre.trim())
    fd.append('precio', String(precio.numericValue))
    fd.append('categoriaId', String(categoriaId))
    if (descripcion.trim()) fd.append('descripcion', descripcion.trim())
    fd.append('requierePreparacion', String(requierePreparacion))
    fd.append('habilitado', String(habilitado))
    if (subcategoriaId !== '') fd.append('subcategoriaId', String(subcategoriaId))

    if (archivo) {
      fd.append('imagen', archivo)
    } else if (imagenUrl.trim()) {
      fd.append('imagenUrl', imagenUrl.trim())
    }

    setSaving(true)
    try {
      await onGuardar(fd)
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  const contenido = (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row2}>
        <div className={styles.campo}>
          <label className={styles.label}>Nombre *</label>
          <input
            className={styles.input}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Hamburguesa"
            autoFocus
          />
        </div>
        <div className={styles.campo}>
          <label className={styles.label}>Precio COP *</label>
          <input
            className={styles.input}
            {...precio.inputProps}
            placeholder="0"
          />
        </div>
      </div>

      <div className={styles.row2}>
        <div className={styles.campo}>
          <label className={styles.label}>Categoría *</label>
          <select
            className={styles.select}
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value === '' ? '' : Number(e.target.value))
              setSubcategoriaId('')
            }}
          >
            <option value="">-- Seleccionar --</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.campo}>
          <label className={styles.label}>Subcategoría</label>
          <select
            className={styles.select}
            value={subcategoriaId}
            onChange={(e) => setSubcategoriaId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={subcategoriasCargando}
          >
            {subcategoriasCargando ? (
              <option value="">Cargando subcategorías...</option>
            ) : (
              <>
                <option value="">-- Ninguna --</option>
                {subcategoriasFiltradas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </>
            )}
          </select>
        </div>
      </div>

      <div className={styles.campo}>
        <label className={styles.label}>Descripción</label>
        <textarea
          className={styles.textarea}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          placeholder="Descripción del producto..."
        />
      </div>

      <div className={styles.checkbox}>
        <input
          type="checkbox"
          id="reqPrep"
          checked={requierePreparacion}
          onChange={(e) => setRequierePreparacion(e.target.checked)}
        />
        <label htmlFor="reqPrep">¿Requiere preparación?</label>
      </div>

      <div className={styles.checkbox}>
        <input
          type="checkbox"
          id="habilitado"
          checked={habilitado}
          onChange={(e) => setHabilitado(e.target.checked)}
        />
        <label htmlFor="habilitado">Habilitar producto para ventas de inmediato</label>
      </div>

      <div className={styles.seccionImagen}>
        <label className={styles.label}>Imagen del producto</label>
        <div className={styles.imagenInputRow}>
          <input
            className={styles.input}
            value={imagenUrl}
            onChange={(e) => {
              setImagenUrl(e.target.value)
              if (archivo) {
                setArchivo(null)
                setArchivoPreview(null)
                if (fileRef.current) fileRef.current.value = ''
              }
            }}
            placeholder="https://ejemplo.com/imagen.jpg"
          />
          <span className={styles.o}>o</span>
          <button
            type="button"
            className={styles.btnSubir}
            onClick={() => fileRef.current?.click()}
          >
            Subir imagen desde archivo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className={styles.fileInputHidden}
            onChange={handleArchivoChange}
          />
        </div>
        {(archivoPreview || previewActual) && (
          <div className={styles.previewContainer}>
            <img
              className={styles.preview}
              src={archivoPreview ?? previewActual ?? ''}
              alt="Preview"
            />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.btnCancelar} onClick={onCerrar}>
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.btnGuardar}
          disabled={saving || !nombre.trim() || !precio.raw || categoriaId === ''}
        >
          {saving
            ? 'Guardando...'
            : esEdicion
              ? 'Guardar Cambios'
              : 'Crear Producto'}
        </button>
      </div>
    </form>
  )

  if (embedded) return contenido

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>{esEdicion ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button className={styles.btnCerrar} onClick={onCerrar}>&times;</button>
        </div>
        {contenido}
      </div>
    </div>
  )
}

export default FormularioProducto

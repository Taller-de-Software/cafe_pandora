import { useState, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMetodosPago, crearMetodoPago, actualizarMetodoPago, eliminarMetodoPago } from '../data/metodos-pago'
import type { MetodoPago } from '../data/metodos-pago'
import { useError } from '@/context/ErrorContext'
import styles from './MetodosPagoLista.module.css'

function MetodosPagoLista() {
  const queryClient = useQueryClient()
  const { showError } = useError()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MetodoPago | null>(null)
  const [nombre, setNombre] = useState('')
  const [entidad, setEntidad] = useState('')

  const { data: metodos = [], isLoading, isError } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
  })

  const createMut = useMutation({
    mutationFn: crearMetodoPago,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metodos-pago'] })
      cerrarFormulario()
    },
    onError: showError,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre?: string; entidad?: string } }) =>
      actualizarMetodoPago(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metodos-pago'] })
      cerrarFormulario()
    },
    onError: showError,
  })

  const deleteMut = useMutation({
    mutationFn: eliminarMetodoPago,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metodos-pago'] }),
    onError: showError,
  })

  function abrirCrear() {
    setEditItem(null)
    setNombre('')
    setEntidad('')
    setShowForm(true)
  }

  function abrirEditar(m: MetodoPago) {
    setEditItem(m)
    setNombre(m.nombre)
    setEntidad(m.entidad ?? '')
    setShowForm(true)
  }

  function cerrarFormulario() {
    setShowForm(false)
    setEditItem(null)
    setNombre('')
    setEntidad('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    if (editItem) {
      await updateMut.mutateAsync({ id: editItem.id, data: { nombre: nombre.trim(), entidad: entidad.trim() || undefined } })
    } else {
      await createMut.mutateAsync({ nombre: nombre.trim(), entidad: entidad.trim() || undefined })
    }
  }

  if (isLoading) return <p className={styles.loading}>Cargando métodos de pago...</p>
  if (isError) return <p className={styles.error}>Error al cargar métodos de pago</p>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h3>Métodos de Pago</h3>
        <button className={styles.addBtn} onClick={abrirCrear}>Nuevo método</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Entidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {metodos.length === 0 ? (
            <tr>
              <td colSpan={4} className={styles.empty}>Sin métodos de pago registrados</td>
            </tr>
          ) : (
            metodos.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>{m.nombre}</td>
                <td>{m.entidad ?? '-'}</td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.editBtn} onClick={() => abrirEditar(m)}>Editar</button>
                    <button className={styles.deleteBtn} onClick={() => {
                      if (window.confirm(`¿Eliminar método de pago "${m.nombre}"?`)) {
                        deleteMut.mutate(m.id)
                      }
                    }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {showForm && (
        <div className={styles.overlay} onClick={cerrarFormulario}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{editItem ? 'Editar método de pago' : 'Nuevo método de pago'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Efectivo, Tarjeta" autoFocus />
              </div>
              <div className={styles.field}>
                <label>Entidad (opcional)</label>
                <input className={styles.input} value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Ej: Visa, Banco XXX" />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={cerrarFormulario}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={createMut.isPending || updateMut.isPending}>
                  {createMut.isPending || updateMut.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MetodosPagoLista

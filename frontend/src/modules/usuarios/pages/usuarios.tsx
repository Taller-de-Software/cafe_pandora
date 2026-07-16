import { useState, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarUsuarios, actualizarUsuario, eliminarUsuario } from '../data/usuarios'
import type { Usuario } from '../data/usuarios'
import { useError } from '@/context/ErrorContext'
import ConfirmModal from '@/componentes/ConfirmModal'
import styles from './usuarios.module.css'

function Usuarios() {
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useError()
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<'administrador' | 'mesero'>('mesero')
  const [pin, setPin] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null)

  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: listarUsuarios,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre?: string; rol?: string; pin?: string } }) =>
      actualizarUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      showSuccess('Usuario actualizado exitosamente')
      closeModal()
    },
    onError: showError,
  })

  const deleteMutation = useMutation({
    mutationFn: eliminarUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      showSuccess('Usuario eliminado exitosamente')
    },
    onError: showError,
  })

  function openEdit(u: Usuario) {
    setEditUser(u)
    setNombre(u.nombre)
    setRol(u.rol as 'administrador' | 'mesero')
    setPin('')
  }

  function closeModal() {
    setEditUser(null)
    setPin('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editUser) return
    const data: { nombre?: string; rol?: string; pin?: string } = {}
    if (nombre.trim()) data.nombre = nombre.trim()
    data.rol = rol
    if (pin) data.pin = pin
    await updateMutation.mutateAsync({ id: editUser.id, data })
  }

  function handleDelete(u: Usuario) {
    setConfirmDelete(u)
  }

  if (isLoading) return <div className={styles.page}><div className={styles.loading}>Cargando usuarios...</div></div>
  if (isError) return <div className={styles.page}><div className={styles.errorMessage}>Error al cargar usuarios</div></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>Gestión de Usuarios</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios?.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.rol}</td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => openEdit(u)}>Editar</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(u)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {editUser && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Editar usuario</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  type="text"
                  className={styles.input}
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Rol</label>
                <select className={styles.select} value={rol} onChange={(e) => setRol(e.target.value as 'administrador' | 'mesero')}>
                  <option value="administrador">Administrador</option>
                  <option value="mesero">Mesero</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>PIN (dejar vacío para no cambiar)</label>
                <input
                  type="password"
                  className={styles.input}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          titulo="Eliminar usuario"
          mensaje={`¿Estás seguro de eliminar al usuario "${confirmDelete.nombre}" (${confirmDelete.rol})? Esta acción no se puede deshacer.`}
          textoConfirmar="Eliminar"
          variante="danger"
          onConfirmar={() => {
            deleteMutation.mutate(confirmDelete.id)
            setConfirmDelete(null)
          }}
          onCancelar={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

export default Usuarios

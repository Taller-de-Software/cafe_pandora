import { useState, type FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../data/usuarios'
import type { Usuario } from '../data/usuarios'
import { useError } from '@/context/ErrorContext'
import ConfirmModal from '@/componentes/ConfirmModal'
import styles from './usuarios.module.css'

type ModalMode = 'create' | 'edit' | null

function Usuarios() {
  const queryClient = useQueryClient()
  const { showError, showSuccess } = useError()
  const [modal, setModal] = useState<ModalMode>(null)
  const [editUser, setEditUser] = useState<Usuario | null>(null)
  const [rol, setRol] = useState<'administrador' | 'mesero'>('mesero')
  const [pin, setPin] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null)

  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ['usuarios'],
    queryFn: listarUsuarios,
  })

  const createMutation = useMutation({
    mutationFn: crearUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      showSuccess('Usuario creado exitosamente')
      closeModal()
    },
    onError: showError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { pin?: string } }) =>
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

  function openCreate() {
    setEditUser(null)
    setRol('mesero')
    setPin('')
    setModal('create')
  }

  function openEdit(u: Usuario) {
    setEditUser(u)
    setRol(u.rol as 'administrador' | 'mesero')
    setPin('')
    setModal('edit')
  }

  function closeModal() {
    setModal(null)
    setEditUser(null)
    setPin('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      if (modal === 'create') {
        await createMutation.mutateAsync({ rol, pin: pin || undefined })
      } else if (modal === 'edit' && editUser) {
        await updateMutation.mutateAsync({ id: editUser.id, data: { pin: pin || undefined } })
      }
    } catch {
      // Error manejado por onError en useMutation
    }
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
        <button className={styles.addBtn} onClick={openCreate}>Nuevo usuario</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios?.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td style={{ textTransform: 'capitalize' }}>{u.rol}</td>
              <td>
                <div className={styles.actions}>
                  <button className={styles.editBtn} onClick={() => openEdit(u)}>Editar PIN</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(u)}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {modal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>{modal === 'create' ? 'Nuevo usuario' : 'Editar usuario'}</h3>
            <form onSubmit={handleSubmit}>
              {modal === 'create' && (
                <div className={styles.field}>
                  <label>Rol</label>
                  <select className={styles.select} value={rol} onChange={(e) => setRol(e.target.value as 'administrador' | 'mesero')}>
                    <option value="administrador">administrador</option>
                    <option value="mesero">mesero</option>
                  </select>
                </div>
              )}
              <div className={styles.field}>
                <label>PIN {modal === 'edit' ? '(dejar vacío para no cambiar)' : ''}</label>
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
                <button type="submit" className={styles.saveBtn} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          titulo="Eliminar usuario"
          mensaje={`¿Estás seguro de eliminar el usuario ${confirmDelete.rol} (ID: ${confirmDelete.id})? Esta acción no se puede deshacer.`}
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

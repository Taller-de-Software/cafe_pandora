import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './modal.module.css'

interface NewTableModalProps {
  onClose: () => void
}

function NewTableModal({ onClose }: NewTableModalProps) {
  const { showError, showWarning, showSuccess } = useError()
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [capacidad, setCapacidad] = useState(4)

  const mutation = useMutation({
    mutationFn: (data: { nombre: string; ubicacion: string; capacidad: number }) =>
      api.post('/mesas', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Mesa creada exitosamente')
      onClose()
    },
    onError: showError,
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !ubicacion.trim()) {
      showWarning('Ingresa un nombre y una ubicación para la mesa.')
      return
    }
    await mutation.mutateAsync({ nombre: nombre.trim(), ubicacion: ubicacion.trim(), capacidad })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Nueva Mesa</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre / Número</label>
            <input className={styles.input} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Mesa 5" autoFocus />
          </div>
          <div className={styles.field}>
            <label>Zona</label>
            <input className={styles.input} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Ventana, Terraza" />
          </div>
          <div className={styles.field}>
            <label>Capacidad</label>
            <input className={styles.input} type="text" inputMode="numeric" maxLength={2} value={capacidad} onChange={(e) => setCapacidad(Math.max(1, parseInt(e.target.value.replace(/\D/g, ''), 10) || 1))} />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={mutation.isPending}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewTableModal

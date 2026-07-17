import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelarReserva, actualizarReserva } from '@modules/pedidos/data/pos'
import { useReservas, type ReservaLocal } from '../context/ReservasContext'
import { useError } from '@/context/ErrorContext'
import type { MesaCompleta } from '../data/pos'
import styles from './modal.module.css'
import localStyles from './EditarReservasModal.module.css'

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

function formatHora(hora: string): string {
  try {
    const [hh, mm] = hora.split(':')
    const h = Number(hh)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${mm} ${ampm}`
  } catch {
    return hora
  }
}

interface EditarReservasModalProps {
  mesas: MesaCompleta[]
  onClose: () => void
}

function EditarReservasModal({ mesas, onClose }: EditarReservasModalProps) {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()
  const { reservas, actualizarReserva: actualizarLocal, cancelarReserva: cancelarLocal } = useReservas()

  const [editando, setEditando] = useState<ReservaLocal | null>(null)
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const mesaIdsExistentes = new Set(mesas.map((m) => m.id))
  const reservasActivas = reservas.filter((r) => r.estado === 'activa' && mesaIdsExistentes.has(r.mesaId))

  const cancelMutation = useMutation({
    mutationFn: (apiId: number) => cancelarReserva(apiId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Reserva cancelada exitosamente')
    },
    onError: showError,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof actualizarReserva>[1] }) =>
      actualizarReserva(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Reserva actualizada exitosamente')
    },
    onError: showError,
  })

  function handleCancel(reserva: ReservaLocal) {
    if (reserva.apiId) {
      cancelMutation.mutate(reserva.apiId, {
        onSuccess: () => {
          cancelarLocal(reserva.id)
          setConfirmCancelId(null)
        },
      })
    } else {
      cancelarLocal(reserva.id)
      setConfirmCancelId(null)
    }
  }

  if (editando) {
    return (
      <EditForm
        reserva={editando}
        onSave={async (data) => {
          try {
            if (editando.apiId) {
              await updateMutation.mutateAsync({
                id: editando.apiId,
                data: {
                  cliente: data.nombreCliente,
                  telefono: data.telefono || undefined,
                  fecha: data.fecha,
                  hora: data.hora,
                  personas: data.numeroPersonas,
                },
              })
            }
            actualizarLocal(editando.id, data)
            setEditando(null)
          } catch {
            /* error handled by mutation's onError */
          }
        }}
        onCancel={() => setEditando(null)}
      />
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${localStyles.modalWider}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={localStyles.modalTitle}>EDITAR RESERVAS</h3>

        {reservasActivas.length === 0 ? (
          <p className={localStyles.emptyText}>No hay reservas activas en este momento.</p>
        ) : (
          <div className={localStyles.list}>
            {reservasActivas.map((r) => (
              <div key={r.id} className={localStyles.item}>
                <div className={localStyles.itemInfo}>
                  <span className={localStyles.mesaName}>{r.mesaNombre}</span>
                  <span className={localStyles.itemDetail}>
                    {r.nombreCliente} &middot; {formatDate(r.fecha)} - {formatHora(r.hora)} &middot; {r.numeroPersonas} {r.numeroPersonas === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
                <div className={localStyles.itemActions}>
                  <button className={localStyles.editBtn} onClick={() => setEditando(r)}>
                    Editar
                  </button>
                  {confirmCancelId === r.id ? (
                    <div className={localStyles.confirmGroup}>
                      <span className={localStyles.confirmText}>¿Cancelar?</span>
                      <button className={localStyles.confirmYesBtn} onClick={() => handleCancel(r)} disabled={cancelMutation.isPending}>
                        Sí
                      </button>
                      <button className={localStyles.confirmNoBtn} onClick={() => setConfirmCancelId(null)}>
                        No
                      </button>
                    </div>
                  ) : (
                    <button className={localStyles.cancelBtn} onClick={() => setConfirmCancelId(r.id)}>
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}

function EditForm({
  reserva,
  onSave,
  onCancel,
}: {
  reserva: ReservaLocal
  onSave: (data: Partial<Omit<ReservaLocal, 'id' | 'apiId'>>) => void
  onCancel: () => void
}) {
  const { showWarning } = useError()
  const [cliente, setCliente] = useState(reserva.nombreCliente)
  const [telefono, setTelefono] = useState(reserva.telefono)
  const [fecha, setFecha] = useState(reserva.fecha)
  const [hora, setHora] = useState(reserva.hora)
  const [personas, setPersonas] = useState(reserva.numeroPersonas)
  const [notas, setNotas] = useState(reserva.notas)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cliente.trim()) {
      showWarning('El nombre del cliente es obligatorio.')
      return
    }
    onSave({
      nombreCliente: cliente.trim(),
      telefono: telefono.trim(),
      fecha,
      hora,
      numeroPersonas: personas,
      notas: notas.trim(),
    })
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={`${styles.modal} ${localStyles.modalWider}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={localStyles.modalTitle}>EDITAR RESERVA — {reserva.mesaNombre}</h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre del cliente</label>
            <input className={styles.input} value={cliente} onChange={(e) => setCliente(e.target.value)} required autoFocus />
          </div>

          <div className={styles.field}>
            <label>Teléfono (opcional)</label>
            <input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ''))} inputMode="numeric" maxLength={10} placeholder="Opcional" />
          </div>

          <div className={localStyles.row}>
            <div className={styles.field}>
              <label>Fecha de la reserva</label>
              <input className={styles.input} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className={styles.field}>
              <label>Hora de la reserva</label>
              <input className={styles.input} type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Número de personas</label>
            <input className={styles.input} type="number" min={1} value={personas} onChange={(e) => setPersonas(Math.max(1, Number(e.target.value)))} required />
          </div>

          <div className={styles.field}>
            <label>Notas (opcional)</label>
            <textarea className={`${styles.input} ${localStyles.textarea}`} value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel}>CANCELAR</button>
            <button type="submit" className={styles.saveBtn}>GUARDAR CAMBIOS</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarReservasModal

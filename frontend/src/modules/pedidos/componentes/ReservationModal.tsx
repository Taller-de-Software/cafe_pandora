import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelarReserva } from '@modules/pedidos/data/pos'
import type { MesaCompleta } from '@modules/pedidos/data/pos'
import { useError } from '@/context/ErrorContext'
import styles from './modal.module.css'

interface ReservationModalProps {
  mesa: MesaCompleta
  onSave: (data: { cliente: string; telefono?: string; fecha: string; hora: string; personas: number; mesaId: number }) => Promise<void>
  onClose: () => void
}

function ReservationModal({ mesa, onSave, onClose }: ReservationModalProps) {
  const { showError } = useError()
  const queryClient = useQueryClient()
  const reserva = mesa.reserva
  const [cliente, setCliente] = useState(reserva?.cliente ?? '')
  const [telefono, setTelefono] = useState(reserva?.telefono ?? '')
  const [fecha, setFecha] = useState(reserva?.fecha?.split('T')[0] ?? new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState(reserva?.hora ?? '19:00')
  const [personas, setPersonas] = useState(reserva?.personas ?? 2)
  const [saving, setSaving] = useState(false)

  const cancelMutation = useMutation({
    mutationFn: () => cancelarReserva(reserva!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      onClose()
    },
    onError: showError,
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cliente.trim()) return
    setSaving(true)
    try {
      await onSave({
        cliente: cliente.trim(),
        telefono: telefono.trim() || undefined,
        fecha,
        hora,
        personas,
        mesaId: mesa.id,
      })
    } catch (err) {
      showError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>Reserva - {mesa.nombre}</h3>

        {reserva ? (
          <div>
            <p><strong>Cliente:</strong> {reserva.cliente}</p>
            {reserva.telefono && <p><strong>Teléfono:</strong> {reserva.telefono}</p>}
            <p><strong>Fecha:</strong> {new Date(reserva.fecha).toLocaleDateString()}</p>
            <p><strong>Hora:</strong> {reserva.hora}</p>
            <p><strong>Personas:</strong> {reserva.personas}</p>
            <div className={styles.actions}>
              <button
                className={styles.cancelBtn}
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancelar reserva
              </button>
              <button className={styles.saveBtn} onClick={onClose}>Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label>Cliente</label>
              <input className={styles.input} value={cliente} onChange={(e) => setCliente(e.target.value)} autoFocus />
            </div>
            <div className={styles.field}>
              <label>Teléfono</label>
              <input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Fecha</label>
              <input className={styles.input} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Hora</label>
              <input className={styles.input} type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Personas</label>
              <input className={styles.input} type="number" min={1} value={personas} onChange={(e) => setPersonas(Number(e.target.value))} />
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>Reservar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ReservationModal

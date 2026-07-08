import { useState, useEffect, useCallback, type FormEvent } from 'react'
import type { Table } from '@/types/Table'
import { formatearHora, formatearFecha } from '@/utils/formatear'
import styles from './EditReservationModal.module.css'

interface EditReservationModalProps {
  open: boolean
  onClose: () => void
  tables: Table[]
  onUpdateReservation: (tableId: string, fecha: string, hora: string, nombreCliente?: string) => void
  onCancelReservation: (tableId: string) => void
}

function EditReservationModal({ open, onClose, tables, onUpdateReservation, onCancelReservation }: EditReservationModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cliente, setCliente] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const reservedTables = tables.filter((t) => t.status === 'RESERVADA')
  const selectedTable = selectedTableId ? tables.find((t) => t.id === selectedTableId) : null

  const reset = useCallback(() => {
    setSelectedTableId(null)
    setFecha('')
    setHora('')
    setCliente('')
    setErrors({})
    setConfirmCancelId(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, handleClose])

  function handleSelectTable(table: Table) {
    setSelectedTableId(table.id)
    if (table.reservation) {
      setFecha(table.reservation.fecha)
      setHora(table.reservation.hora)
      setCliente(table.reservation.nombreCliente ?? '')
    }
    if (errors.mesa) setErrors((prev) => { const next = { ...prev }; delete next.mesa; return next })
  }

  function handleConfirm(e: FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!selectedTableId) newErrors.mesa = 'Debe seleccionar una mesa'
    if (!fecha) newErrors.fecha = 'Debe seleccionar una fecha'
    if (!hora) newErrors.hora = 'Debe seleccionar una hora'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onUpdateReservation(selectedTableId!, fecha, hora, cliente || undefined)
    handleClose()
  }

  function handleCancelReservation() {
    if (!confirmCancelId) return
    onCancelReservation(confirmCancelId)
    setConfirmCancelId(null)
    handleClose()
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={`${styles.modal} ${styles.modalWider}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className={styles.title}>EDITAR RESERVA</h2>
          <p className={styles.description}>
            Seleccione una reserva para modificar sus datos.
          </p>
        </div>

        <form className={styles.formBody} onSubmit={handleConfirm}>
          <div className={styles.field}>
            <label className={styles.label}>SELECCIONAR RESERVA</label>
            {reservedTables.length === 0 ? (
              <p className={styles.emptyText}>No hay mesas reservadas. Reserve una mesa primero.</p>
            ) : (
              <div className={styles.mesasContainer}>
              <div className={styles.mesasGrid}>
                {reservedTables.map((t) => {
                  const isSelected = selectedTableId === t.id
                  return (
                    <div
                      key={t.id}
                      className={`${styles.mesaCard} ${isSelected ? styles.mesaCardSelected : ''}`}
                      onClick={() => handleSelectTable(t)}
                    >
                      <span className={styles.mesaName}>Mesa {t.name} ({t.type})</span>
                      <span className={styles.mesaBadge}>{t.status}</span>
                      {t.reservation && (
                        <div className={styles.mesaReservationDetail}>
                          <span>Cliente: {t.reservation.nombreCliente ?? '—'}</span>
                          <span>Fecha: {formatearFecha(t.reservation?.fecha)}</span>
                          <span>Hora: {formatearHora(t.reservation?.hora)}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              </div>
            )}
            {errors.mesa && <p className={styles.errorText}>{errors.mesa}</p>}
          </div>

          {selectedTable && (
            <div className={styles.field}>
              <label className={styles.label}>MESA</label>
              <div className={styles.mesaReadonly}>
                Mesa {selectedTable.name} ({selectedTable.type})
              </div>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>FECHA</label>
              <input
                className={`${styles.input} ${errors.fecha ? styles.inputError : ''}`}
                type="date"
                value={fecha}
                onChange={(e) => {
                  setFecha(e.target.value)
                  if (errors.fecha) setErrors((prev) => { const next = { ...prev }; delete next.fecha; return next })
                }}
              />
              {errors.fecha && <p className={styles.errorText}>{errors.fecha}</p>}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>HORA</label>
              <input
                className={`${styles.input} ${errors.hora ? styles.inputError : ''}`}
                type="time"
                value={hora}
                onChange={(e) => {
                  setHora(e.target.value)
                  if (errors.hora) setErrors((prev) => { const next = { ...prev }; delete next.hora; return next })
                }}
              />
              {errors.hora && <p className={styles.errorText}>{errors.hora}</p>}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>NOMBRE DEL CLIENTE</label>
            <input
              className={styles.input}
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className={styles.actions}>
            {selectedTableId && (
              <button type="button" className={styles.btnCancelReservation} onClick={() => setConfirmCancelId(selectedTableId)}>
                Cancelar Reserva
              </button>
            )}
            <div className={styles.actionsRight}>
              <button type="button" className={styles.btnCancel} onClick={handleClose}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnConfirm}>
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>

      {confirmCancelId && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmCancelId(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Cancelar reserva?</h3>
            <p className={styles.confirmText}>
              Se eliminará la reserva y la mesa quedará libre. Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmNo} onClick={() => setConfirmCancelId(null)}>No</button>
              <button className={styles.confirmYes} onClick={handleCancelReservation}>Sí, cancelar reserva</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditReservationModal
import { useState, useEffect, useCallback, type FormEvent } from 'react'
import type { Table } from '@/types/Table'
import styles from './ReserveTableModal.module.css'

interface ReserveTableModalProps {
  open: boolean
  onClose: () => void
  tables: Table[]
  onReserve: (tableId: string, date: string, time: string, customerName?: string) => void
}

function todayString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function ReserveTableModal({ open, onClose, tables, onReserve }: ReserveTableModalProps) {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [cliente, setCliente] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const reset = useCallback(() => {
    setSelectedTableId(null)
    setFecha('')
    setHora('')
    setCliente('')
    setErrors({})
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

    onReserve(selectedTableId!, fecha, hora, cliente || undefined)
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
          <h2 className={styles.title}>RESERVAR UNA MESA</h2>
          <p className={styles.description}>
            Seleccione la mesa, fecha y hora para la reserva.
          </p>
        </div>

        <form className={styles.formBody} onSubmit={handleConfirm}>
          <div className={styles.field}>
            <label className={styles.label}>SELECCIONAR MESA</label>
            {tables.length === 0 ? (
              <p className={styles.emptyText}>No hay mesas disponibles. Cree una mesa primero.</p>
            ) : (
              <div className={styles.mesasContainer}>
              <div className={styles.mesasGrid}>
                {tables.map((t) => {
                  const isSelected = selectedTableId === t.id
                  const isDisabled = t.status !== 'VACÍA'
                  return (
                    <div
                      key={t.id}
                      className={`${styles.mesaCard} ${isSelected ? styles.mesaCardSelected : ''} ${isDisabled ? styles.mesaCardDisabled : ''}`}
                      onClick={() => {
                        if (isDisabled) return
                        setSelectedTableId(t.id)
                        if (errors.mesa) setErrors((prev) => { const next = { ...prev }; delete next.mesa; return next })
                      }}
                    >
                      <span className={styles.mesaName}>Mesa {t.name} ({t.type})</span>
                      <span className={styles.mesaBadge}>{t.status}</span>
                    </div>
                  )
                })}
              </div>
              </div>
            )}
            {errors.mesa && <p className={styles.errorText}>{errors.mesa}</p>}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>FECHA</label>
              <input
                className={`${styles.input} ${errors.fecha ? styles.inputError : ''}`}
                type="date"
                min={todayString()}
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
            <label className={styles.label}>NOMBRE DEL CLIENTE (opcional)</label>
            <input
              className={styles.input}
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnConfirm}>
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReserveTableModal

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import styles from './AddTableModal.module.css'

import type { TableType } from '@/types/Table'

interface AddTableModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (name: string, type: TableType) => void
}

const TABLE_TYPES: { label: TableType; value: TableType }[] = [
  { label: 'Exterior', value: 'Exterior' },
  { label: 'Terraza', value: 'Terraza' },
]

function AddTableModal({ open, onClose, onConfirm }: AddTableModalProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TableType>('Exterior')
  const [error, setError] = useState('')

  const preview = `Mesa ${nombre.trim() || '___'} (${tipo})`

  const reset = useCallback(() => {
    setNombre('')
    setTipo('Exterior')
    setError('')
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  useEffect(() => {
    if (open) {
      reset()
    }
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
    if (!nombre.trim()) {
      setError('El nombre o número de la mesa es obligatorio')
      return
    }
    onConfirm(nombre.trim(), tipo)
    handleClose()
  }

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <svg className={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className={styles.title}>AGREGAR NUEVA MESA</h2>
          <p className={styles.description}>
            Escriba el nombre o identificador único para la nueva mesa.
          </p>
        </div>

        <form onSubmit={handleConfirm}>
          <div className={styles.field}>
            <label className={styles.label}>NOMBRE O NÚMERO DE LA MESA</label>
            <input
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                if (error) setError('')
              }}
              placeholder="Ej. 14 o VIP"
              autoFocus
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>TIPO DE MESA</label>
            <div className={styles.tipoGroup}>
              {TABLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`${styles.tipoBtn} ${tipo === t.value ? styles.tipoBtnActive : ''}`}
                  onClick={() => setTipo(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.previewCard}>
            <p className={styles.previewLabel}>VISTA PREVIA AUTOMÁTICA</p>
            <p className={styles.previewText}>{preview}</p>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnConfirm}>
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTableModal

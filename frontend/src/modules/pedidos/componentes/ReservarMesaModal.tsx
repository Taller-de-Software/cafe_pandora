import { useState, type FormEvent } from 'react'
import type { MesaCompleta } from '../data/pos'
import styles from './modal.module.css'
import localStyles from './ReservarMesaModal.module.css'

interface ReservarMesaModalProps {
  mesasVacias: MesaCompleta[]
  onSave: (data: { mesaId: number; cliente: string; telefono?: string; fecha: string; hora: string; personas: number; notas?: string }) => Promise<void>
  onClose: () => void
}

function ReservarMesaModal({ mesasVacias, onSave, onClose }: ReservarMesaModalProps) {
  const [mesaId, setMesaId] = useState(mesasVacias[0]?.id ?? 0)
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [hora, setHora] = useState('19:00')
  const [personas, setPersonas] = useState(2)
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!cliente.trim() || !mesaId) return
    setSaving(true)
    try {
      await onSave({
        mesaId,
        cliente: cliente.trim(),
        telefono: telefono.trim() || undefined,
        fecha,
        hora,
        personas,
        notas: notas.trim() || undefined,
      })
    } catch {
      setSaving(false)
    }
  }

  const selectedMesa = mesasVacias.find((m) => m.id === mesaId)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${localStyles.modalWider}`} onClick={(e) => e.stopPropagation()}>
        <h3 className={localStyles.modalTitle}>RESERVAR MESA</h3>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Mesa a reservar</label>
            <select className={styles.select} value={mesaId} onChange={(e) => setMesaId(Number(e.target.value))}>
              {mesasVacias.length === 0 && <option value={0}>No hay mesas vacías disponibles</option>}
              {mesasVacias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.ubicacion}) — Capacidad: {m.capacidad} pers.
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Nombre del cliente</label>
            <input className={styles.input} value={cliente} onChange={(e) => setCliente(e.target.value)} required autoFocus />
          </div>

          <div className={styles.field}>
            <label>Teléfono (opcional)</label>
            <input className={styles.input} value={telefono} onChange={(e) => setTelefono(e.target.value)} />
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
            <button type="button" className={styles.cancelBtn} onClick={onClose}>CANCELAR</button>
            <button type="submit" className={styles.saveBtn} disabled={saving || mesasVacias.length === 0}>
              CONFIRMAR RESERVA
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservarMesaModal

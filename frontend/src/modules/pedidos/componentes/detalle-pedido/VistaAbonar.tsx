import { useFormattedInput } from '@/hooks/useFormattedInput'
import styles from './VistaAbonar.module.css'

interface VistaAbonarProps {
  montoIngresado: number
  setMontoIngresado: (v: number) => void
  metodoPagoAbono: number | null
  setMetodoPagoAbono: (v: number | null) => void
  metodosPago: { id: number; nombre: string; entidad?: string }[]
  totalPedido: number
  totalAbonado: number
  saldoPendiente: number
  montoError: string
  onConfirmar: () => void
  onVolver: () => void
  isPending: boolean
  disabled: boolean
}

export default function VistaAbonar({
  montoIngresado,
  setMontoIngresado,
  metodoPagoAbono,
  setMetodoPagoAbono,
  metodosPago,
  totalPedido,
  totalAbonado,
  saldoPendiente,
  montoError,
  onConfirmar,
  onVolver,
  isPending,
  disabled,
}: VistaAbonarProps) {
  const recibido = useFormattedInput({ type: 'money', initialValue: String(montoIngresado) })

  const montoValido = montoIngresado > 0 && montoIngresado <= saldoPendiente && metodoPagoAbono !== null

  return (
    <>
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>ABONAR DINERO</span>
          <button className={styles.editVolverBtn} onClick={onVolver}>VOLVER</button>
        </div>
        <p className={styles.separarInstruccion}>Ingrese el monto que el cliente abona a la cuenta.</p>

        <div className={styles.abonoTotalRow}>
          <span className={styles.abonoLabel}>MONTO A ABONAR ($)</span>
        </div>
        <input
          className={styles.abonoInput}
          type="text"
          inputMode="numeric"
          placeholder="$ 0"
          value={recibido.value}
          onChange={recibido.onChange}
        />
        {montoError && <p className={styles.abonoError}>{montoError}</p>}

        <div className={styles.abonoTotalRow} style={{ marginTop: '12px' }}>
          <span className={styles.abonoLabel}>MÉTODO DE PAGO</span>
        </div>
        <select
          className={styles.editSearchInput}
          value={metodoPagoAbono ?? ''}
          onChange={(e) => setMetodoPagoAbono(Number(e.target.value) || null)}
        >
          <option value="">Seleccionar método...</option>
          {metodosPago.map((mp) => (
            <option key={mp.id} value={mp.id}>{mp.nombre}{mp.entidad ? ` - ${mp.entidad}` : ''}</option>
          ))}
        </select>

        <div className={styles.abonoSaldoRow} style={{ marginTop: '12px' }}>
          <span className={styles.abonoLabel}>TOTAL PEDIDO</span>
          <span className={styles.abonoTotal}>${totalPedido.toLocaleString('es-CO')}</span>
        </div>
        <div className={styles.abonoSaldoRow}>
          <span className={styles.abonoLabel}>YA ABONADO</span>
          <span className={styles.abonoTotal}>${totalAbonado.toLocaleString('es-CO')}</span>
        </div>
        <div className={styles.abonoSaldoRow}>
          <span className={styles.abonoLabel}>SALDO PENDIENTE</span>
          <span className={styles.abonoTotal}>${saldoPendiente.toLocaleString('es-CO')}</span>
        </div>
      </div>

      <div className={styles.footerLeft}>
        <button className={styles.btnVolverFooter} onClick={onVolver}>VOLVER</button>
      </div>
      <button className={styles.btnConfirmar} disabled={disabled || isPending} onClick={onConfirmar}>
        {isPending ? 'Registrando...' : 'CONFIRMAR ABONO'}
      </button>
    </>
  )
}
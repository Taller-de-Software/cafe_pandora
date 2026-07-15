import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import type { Pedido } from '../data/pedidos'
import { listarMetodosPago, crearFactura, imprimirFactura, obtenerSesionCajaActiva } from '../data/facturas'
import type { MetodoPago } from '../data/facturas'
import { useError } from '@/context/ErrorContext'
import { useFormattedInput } from '@/hooks/useFormattedInput'
import styles from './FacturaModal.module.css'

interface FacturaModalProps {
  pedido: Pedido
  onClose: () => void
}

const SVG_EFECTIVO = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const SVG_TRANSFERENCIA = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const SVG_TARJETA = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
)

const ICONOS: Record<string, React.ReactNode> = {
  EFECTIVO: SVG_EFECTIVO,
  TRANSFERENCIA: SVG_TRANSFERENCIA,
  TARJETA: SVG_TARJETA,
}

const TRANSFERENCIA_ENTIDADES = ['NEQUI', 'DAVIPLATA', 'NU'] as const

function FacturaModal({ pedido, onClose }: FacturaModalProps) {
  const { showError, showWarning, showSuccess } = useError()
  const [metodoSeleccionId, setMetodoSeleccionId] = useState<number | null>(null)
  const recibido = useFormattedInput({ type: 'money' })
  const [cobrarImpuesto, setCobrarImpuesto] = useState(false)
  const [entidadTransferencia, setEntidadTransferencia] = useState<typeof TRANSFERENCIA_ENTIDADES[number]>('NEQUI')

  const { data: metodosPago = [], isPending: metodosLoading } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
    onError: showError,
  })

  const { data: sesionCaja } = useQuery({
    queryKey: ['sesion-caja-activa'],
    queryFn: obtenerSesionCajaActiva,
    onError: showError,
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const metodosUnicos = useMemo(() => {
    const seen = new Set<string>()
    return metodosPago.filter((m) => {
      if (seen.has(m.nombre)) return false
      seen.add(m.nombre)
      return true
    })
  }, [metodosPago])

  const metodoSeleccionado = useMemo(() => {
    if (!metodoSeleccionId) return null
    return metodosPago.find((m) => m.id === metodoSeleccionId) ?? null
  }, [metodosPago, metodoSeleccionId])

  const handleMetodoClick = useCallback((metodo: MetodoPago) => {
    if (metodo.nombre.toUpperCase() === 'TRANSFERENCIA') {
      setEntidadTransferencia('NEQUI')
      const match = metodosPago.find(
        (m) => m.nombre.toUpperCase() === 'TRANSFERENCIA' && m.entidad?.toUpperCase() === 'NEQUI'
      )
      setMetodoSeleccionId(match?.id ?? null)
    } else {
      setMetodoSeleccionId(metodo.id)
    }
  }, [metodosPago])

  const handleEntidadTransferenciaClick = useCallback((entidad: string) => {
    setEntidadTransferencia(entidad as typeof TRANSFERENCIA_ENTIDADES[number])
    const match = metodosPago.find(
      (m) => m.nombre.toUpperCase() === 'TRANSFERENCIA' && m.entidad?.toUpperCase() === entidad
    )
    setMetodoSeleccionId(match?.id ?? null)
  }, [metodosPago])

  const totalPedido = useMemo(() => {
    return pedido.total ?? pedido.detalles.reduce((acc, d) => acc + d.precioUnitario * d.cantidad, 0)
  }, [pedido])

  const totalAbonado = pedido.totalAbonado ?? 0
  const saldoPendiente = useMemo(() => Math.max(totalPedido - totalAbonado, 0), [totalPedido, totalAbonado])

  const subtotal = saldoPendiente

  const impuesto = useMemo(
    () => (cobrarImpuesto ? subtotal * 0.08 : 0),
    [cobrarImpuesto, subtotal]
  )

  const total = useMemo(() => subtotal + impuesto, [subtotal, impuesto])

  const cambio = useMemo(
    () => (recibido.numericValue >= total ? recibido.numericValue - total : 0),
    [recibido.numericValue, total]
  )

  const hoy = new Date()
  const fechaStr = hoy.toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })

  const mesaNombre = pedido.mesa?.nombre ?? `Mesa ${pedido.mesaId}`
  const mesaNum = mesaNombre.replace(/\D/g, '')

  const crearFacturaMut = useMutation({
    mutationFn: crearFactura,
    onError: showError,
  })

  const imprimirFacturaMut = useMutation({
    mutationFn: imprimirFactura,
    onError: showError,
  })

  async function handleGenerar() {
    if (!metodoSeleccionId || !sesionCaja?.id) {
      showError('No hay método de pago seleccionado o no hay sesión de caja activa')
      return
    }

    if (esEfectivo && recibido.numericValue < total) {
      showWarning(`El monto recibido ($${recibido.numericValue.toLocaleString('es-CO')}) es menor al total ($${total.toLocaleString('es-CO')}). Falta $${(total - recibido.numericValue).toLocaleString('es-CO')}.`)
      return
    }

    try {
      const factura = await crearFacturaMut.mutateAsync({
        pedidoId: pedido.id,
        subtotal,
        impuestoConsumo: impuesto,
        total,
        metodoPagoId: metodoSeleccionId,
        cajaSesionId: sesionCaja.id,
      })

      await imprimirFacturaMut.mutateAsync(factura.id)
      showSuccess('Factura generada y enviada a impresión exitosamente')
      onClose()
    } catch {
      // error handled by mutation onError
    }
  }

  const esEfectivo = metodoSeleccionado?.nombre.toUpperCase() === 'EFECTIVO'
  const montoInsuficiente = esEfectivo && recibido.numericValue < total
  const puedeGenerar = metodoSeleccionId !== null && sesionCaja?.id && !montoInsuficiente

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaBadge}>{mesaNum || '?'}</div>
            <div className={styles.headerInfo}>
              <h2 className={styles.headerTitle}>MESA {mesaNum}</h2>
              <span className={styles.headerDate}>{fechaStr} &middot; {new Date(pedido.creadoEn).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.infoRow}>
          <div className={styles.infoLeft}>
            <span className={styles.infoLabel}>MESA</span>
            <span className={styles.mesaNombre}>{mesaNombre.toUpperCase()}</span>
            <span className={styles.mesero}>Mesero: {(pedido.usuario as any)?.nombre?.toUpperCase() ?? pedido.usuario?.rol?.toUpperCase() ?? '—'}</span>
          </div>
          <div className={styles.infoRight}>
            <span className={styles.infoLabel}>TOTAL PEDIDO</span>
            <span className={styles.totalGrande}>${totalPedido.toLocaleString('es-CO')}</span>
            {totalAbonado > 0 && (
              <>
                <span className={styles.infoLabel}>YA ABONADO</span>
                <span className={styles.totalAbonado}>-${totalAbonado.toLocaleString('es-CO')}</span>
                <span className={styles.infoLabel}>SALDO PENDIENTE</span>
                <span className={styles.saldoPendiente}>${saldoPendiente.toLocaleString('es-CO')}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionTitle}>MÉTODO DE PAGO</span>
          {metodosLoading ? (
            <p className={styles.emptyMsg}>Cargando métodos de pago...</p>
          ) : metodosUnicos.length === 0 ? (
            <p className={styles.emptyMsg}>No hay métodos de pago configurados</p>
          ) : (
            <div className={styles.metodosGrid}>
              {metodosUnicos.map((m) => (
                <button
                  key={m.id}
                  className={`${styles.metodoCard} ${metodoSeleccionado?.nombre === m.nombre ? styles.metodoActivo : ''}`}
                  onClick={() => handleMetodoClick(m)}
                >
                  <span className={`${styles.metodoIconCircle} ${metodoSeleccionado?.nombre === m.nombre ? styles.metodoIconActivo : ''}`}>
                    {ICONOS[m.nombre.toUpperCase()] ?? SVG_EFECTIVO}
                  </span>
                  <span className={styles.metodoLabel}>{m.nombre.toUpperCase()}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {metodoSeleccionado?.nombre.toUpperCase() === 'TRANSFERENCIA' && (
          <div className={styles.section}>
            <span className={styles.sectionTitle}>ENTIDAD DE TRANSFERENCIA</span>
            <div className={styles.entidadGrid}>
              {TRANSFERENCIA_ENTIDADES.map((entidad) => (
                <button
                  key={entidad}
                  className={`${styles.entidadCard} ${entidadTransferencia === entidad ? styles.entidadActiva : ''}`}
                  onClick={() => handleEntidadTransferenciaClick(entidad)}
                >
                  {entidad}
                </button>
              ))}
            </div>
          </div>
        )}

        {metodoSeleccionado?.nombre.toUpperCase() === 'EFECTIVO' && (
          <div className={styles.montoRow}>
            <div className={styles.montoField}>
              <label className={styles.montoLabel}>RECIBIDO</label>
              <input
                className={`${styles.montoInput} ${recibido.numericValue > 0 && recibido.numericValue < total ? styles.montoInputError : ''}`}
                {...recibido.inputProps}
                placeholder="$0"
              />
              {recibido.numericValue > 0 && recibido.numericValue < total && (
                <span className={styles.montoWarning}>
                  Falta ${(total - recibido.numericValue).toLocaleString('es-CO')} para cubrir el total
                </span>
              )}
            </div>
            <div className={styles.montoField}>
              <label className={styles.montoLabel}>CAMBIO</label>
              <input
                className={styles.montoInput}
                type="text"
                readOnly
                value={`$${cambio.toLocaleString('es-CO')}`}
                tabIndex={-1}
              />
            </div>
          </div>
        )}

        <div className={styles.impuestoRow}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={cobrarImpuesto}
              onChange={(e) => setCobrarImpuesto(e.target.checked)}
            />
            <span className={styles.switchSlider} />
          </label>
          <div className={styles.impuestoText}>
            <span className={styles.impuestoTitle}>COBRAR IMPUESTO DE CONSUMO (8%)</span>
            <span className={styles.impuestoDesc}>Calcula y suma el 8% al subtotal del pedido.</span>
          </div>
        </div>

        <div className={styles.resumen}>
          {totalAbonado > 0 && (
            <>
              <div className={styles.resumenRow}>
                <span className={styles.resumenLabel}>Total pedido</span>
                <span className={styles.resumenValor}>${totalPedido.toLocaleString('es-CO')}</span>
              </div>
              <div className={styles.resumenRow}>
                <span className={styles.resumenLabel}>Ya abonado</span>
                <span className={styles.resumenValor}>-${totalAbonado.toLocaleString('es-CO')}</span>
              </div>
              <div className={`${styles.resumenRow} ${styles.resumenDivider}`}>
                <span className={styles.resumenLabel}>Saldo pendiente</span>
                <span className={styles.resumenValor}>${saldoPendiente.toLocaleString('es-CO')}</span>
              </div>
            </>
          )}
          <div className={styles.resumenRow}>
            <span className={styles.resumenLabel}>{totalAbonado > 0 ? 'Subtotal a cobrar' : 'Subtotal'}</span>
            <span className={styles.resumenValor}>${subtotal.toLocaleString('es-CO')}</span>
          </div>
          {cobrarImpuesto && (
            <div className={styles.resumenRow}>
              <span className={styles.resumenLabel}>Impuesto consumo (8%)</span>
              <span className={styles.resumenValor}>${impuesto.toLocaleString('es-CO')}</span>
            </div>
          )}
          <div className={`${styles.resumenRow} ${styles.resumenTotal}`}>
            <span className={styles.resumenLabel}>Total a cobrar</span>
            <span className={styles.totalFinal}>${total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnCancelar} onClick={onClose}>
            CANCELAR
          </button>
          <button
            className={styles.btnGenerar}
            onClick={handleGenerar}
            disabled={!puedeGenerar || crearFacturaMut.isPending}
          >
            {crearFacturaMut.isPending ? 'GENERANDO...' : puedeGenerar ? 'CONFIRMAR COBRO' : 'GENERAR FACTURA'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FacturaModal

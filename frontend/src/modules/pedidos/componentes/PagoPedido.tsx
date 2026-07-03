import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMetodosPago, crearFactura, obtenerSesionCajaActiva } from '../data/facturas'
import type { Pedido } from '../data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import { useError } from '@/context/ErrorContext'
import styles from './PagoPedido.module.css'

interface PagoPedidoProps {
  pedido: Pedido
  onClose: () => void
  onPagoExitoso: () => void
}

function PagoPedido({ pedido, onClose, onPagoExitoso }: PagoPedidoProps) {
  const { showError } = useError()
  const queryClient = useQueryClient()
  const [metodoPagoId, setMetodoPagoId] = useState<number | null>(null)
  const [cajaSesionId, setCajaSesionId] = useState<number | null>(null)

  const subtotal = pedido.total ?? 0
  const impuestoConsumo = Math.round(subtotal * 0.08 * 100) / 100
  const total = subtotal + impuestoConsumo

  const { data: metodosPago = [] } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
  })

  useEffect(() => {
    obtenerSesionCajaActiva()
      .then((sesion) => {
        if (sesion) setCajaSesionId(sesion.id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (metodosPago.length > 0 && metodoPagoId === null) {
      setMetodoPagoId(metodosPago[0].id)
    }
  }, [metodosPago, metodoPagoId])

  const pagoMut = useMutation({
    mutationFn: () =>
      crearFactura({
        pedidoId: pedido.id,
        subtotal,
        impuestoConsumo,
        total,
        metodoPagoId: metodoPagoId!,
        cajaSesionId: cajaSesionId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-cocinando'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-listos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      onPagoExitoso()
    },
    onError: showError,
  })

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Cobrar Pedido</h3>
          <span className={styles.mesa}>{pedido.mesa.nombre} · Turno #{pedido.turno}</span>
        </div>

        <div className={styles.items}>
          {pedido.detalles.map((d) => (
            <div key={d.id} className={styles.item}>
              <span>{d.cantidad}x {d.producto.nombre}</span>
              <span>${formatearNumero(d.precioUnitario * d.cantidad)}</span>
            </div>
          ))}
        </div>

        <div className={styles.totals}>
          <div className={styles.row}>
            <span>Subtotal</span>
            <span>${formatearNumero(subtotal)}</span>
          </div>
          <div className={styles.row}>
            <span>Impuesto Consumo (8%)</span>
            <span>${formatearNumero(impuestoConsumo)}</span>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <span>Total</span>
            <span>${formatearNumero(total)}</span>
          </div>
        </div>

        <div className={styles.field}>
          <label>Método de Pago</label>
          <select
            className={styles.select}
            value={metodoPagoId ?? ''}
            onChange={(e) => setMetodoPagoId(Number(e.target.value))}
          >
            {metodosPago.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.nombre}{mp.entidad ? ` (${mp.entidad})` : ''}
              </option>
            ))}
          </select>
        </div>

        {!cajaSesionId && (
          <p className={styles.warning}>No hay una sesión de caja activa. Abre caja en Caja y Finanzas.</p>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button
            className={styles.payBtn}
            onClick={() => pagoMut.mutate()}
            disabled={!metodoPagoId || !cajaSesionId || pagoMut.isPending}
          >
            {pagoMut.isPending ? 'Cobrando...' : 'Cobrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PagoPedido

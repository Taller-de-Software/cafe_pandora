import { useState, useEffect } from 'react'
import type { PedidoPendiente } from '@/types/PedidoPendiente'
import DetallePedidoModal from './DetallePedidoModal'
import FacturaModal from './FacturaModal'
import { imprimirReciboCocina } from '../data/pedidos'
import { imprimirFactura } from '../data/facturas'
import styles from './ColaDeComandasPendientes.module.css'

interface ColaDeComandasPendientesProps {
  pedidos: PedidoPendiente[]
  onCancelar: (id: string) => void
  onCambiarEstado: (id: string, estado: PedidoPendiente['estado']) => void
  emptyMessage?: string
  emptyHint?: string
}

const BADGE_CLASS: Record<PedidoPendiente['estado'], string> = {
  RECIBIDO: styles.badge,
  PENDIENTE: styles.badgePendiente,
  HECHO: styles.badgeHecho,
  FINALIZADO: styles.badgeFinalizado,
}

function ColaDeComandasPendientes({ pedidos, onCancelar, onCambiarEstado, emptyMessage, emptyHint }: ColaDeComandasPendientesProps) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [detailPedido, setDetailPedido] = useState<PedidoPendiente | null>(null)
  const [facturaPedido, setFacturaPedido] = useState<PedidoPendiente | null>(null)

  useEffect(() => {
    if (detailPedido) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [detailPedido])

  useEffect(() => {
    if (!confirmCancelId) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmCancelId(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [confirmCancelId])

  const handleReciboCocina = (id: string) => {
    onCambiarEstado(id, 'PENDIENTE')
    imprimirReciboCocina(id).catch((err) => console.error('Error al imprimir recibo cocina:', err))
  }

  const handleCambiarEstado = (id: string) => {
    onCambiarEstado(id, 'HECHO')
  }

  const handleFacturaPago = (pedido: PedidoPendiente) => {
    setFacturaPedido(pedido)
  }

  const handleConfirmarFactura = (id: string) => {
    onCambiarEstado(id, 'FINALIZADO')
    imprimirFactura(id).catch((err) => console.error('Error al generar factura:', err))
    setFacturaPedido(null)
  }

  const renderActions = (pedido: PedidoPendiente) => {
    switch (pedido.estado) {
      case 'RECIBIDO':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnCocina}
              onClick={(e) => { e.stopPropagation(); handleReciboCocina(pedido.id) }}
            >
              GENERAR RECIBO<br />COCINA
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(pedido.id) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'PENDIENTE':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnEstadoPendiente}
              onClick={(e) => { e.stopPropagation(); handleCambiarEstado(pedido.id) }}
            >
              CAMBIAR ESTADO<br />PEDIDO
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(pedido.id) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'HECHO':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnEstadoHecho}
              onClick={(e) => { e.stopPropagation(); handleFacturaPago(pedido) }}
            >
              GENERAR FACTURA<br />PAGO
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(pedido.id) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'FINALIZADO':
        return (
          <div className={styles.cardActionsFinalizado}>
            <span className={styles.finalizadoText}>PEDIDO FINALIZADO</span>
          </div>
        )
    }
  }

  if (pedidos.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyMessage ?? 'No hay pedidos pendientes'}</p>
        {emptyHint && <p className={styles.emptyHint}>{emptyHint}</p>}
      </div>
    )
  }

  return (
    <div>
      <div className={styles.grid}>
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className={`${styles.card} ${pedido.estado === 'FINALIZADO' ? styles.cardFinalizado : ''}`}
            onClick={() => setDetailPedido(pedido)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.mesaName}>
                  {pedido.mesa.replace(/\s*\(.*?\)\s*$/, '').toUpperCase()}
                  {pedido.esCuentaSeparada && ' (SEPARADA)'}
                </span>
                <span className={styles.hora}>&#x1F550; {pedido.horaCreacion}</span>
              </div>
              <span className={BADGE_CLASS[pedido.estado]}>{pedido.estado}</span>
              <div className={styles.headerRight}>
                <span className={styles.turno}>Turno #{pedido.turno}</span>
                <span className={styles.id}>ID: #{pedido.id}</span>
              </div>
            </div>

            <div className={styles.cardDivider} />

            <span className={styles.itemsTitle}>ÍTEMS EN COMANDA</span>

            <div className={styles.itemsScroll}>
              {pedido.items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <span className={styles.itemName}>{item.nombre.toUpperCase()}</span>
                  <span className={styles.itemCant}>Cant: {item.cantidad}</span>
                </div>
              ))}
            </div>

            <div className={styles.cardDivider} />

            {renderActions(pedido)}
          </div>
        ))}
      </div>

      {confirmCancelId && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmCancelId(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Cancelar pedido?</h3>
            <p className={styles.confirmText}>
              Se eliminará el pedido de la mesa actual. Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmNo} onClick={() => setConfirmCancelId(null)}>No</button>
              <button className={styles.confirmYes} onClick={() => { onCancelar(confirmCancelId); setConfirmCancelId(null) }}>Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {detailPedido && (
        <DetallePedidoModal pedido={detailPedido} onClose={() => setDetailPedido(null)} />
      )}

      {facturaPedido && (
        <FacturaModal
          pedido={facturaPedido}
          onClose={() => setFacturaPedido(null)}
          onConfirmar={handleConfirmarFactura}
        />
      )}
    </div>
  )
}

export default ColaDeComandasPendientes

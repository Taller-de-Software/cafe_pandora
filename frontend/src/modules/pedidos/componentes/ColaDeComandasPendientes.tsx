import { useState, useEffect } from 'react'
import type { Pedido } from '../data/pedidos'
import DetallePedidoSimple from './DetallePedidoSimple'
import FacturaModal from './FacturaModal'
import styles from './ColaDeComandasPendientes.module.css'

interface ColaDeComandasPendientesProps {
  pedidos: Pedido[]
  onCancelar: (id: string) => void
  onCambiarEstado: (id: string, estado: string) => void
  emptyMessage?: string
  emptyHint?: string
}

const BADGE_CLASS: Record<string, string> = {
  recibido: styles.badge,
  pendiente: styles.badgePendiente,
  hecho: styles.badgeHecho,
  finalizado: styles.badgeFinalizado,
}

const BADGE_LABEL: Record<string, string> = {
  recibido: 'RECIBIDO',
  pendiente: 'PENDIENTE',
  hecho: 'HECHO',
  finalizado: 'FINALIZADO',
}

function ColaDeComandasPendientes({ pedidos, onCancelar, onCambiarEstado, emptyMessage, emptyHint }: ColaDeComandasPendientesProps) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null)
  const [pedidoAFacturar, setPedidoAFacturar] = useState<Pedido | null>(null)

  useEffect(() => {
    if (detailPedido || pedidoAFacturar) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [detailPedido, pedidoAFacturar])

  useEffect(() => {
    if (!confirmCancelId) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmCancelId(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [confirmCancelId])

  const handleReciboCocina = (id: string) => {
    onCambiarEstado(id, 'pendiente')
  }

  const handleCambiarEstado = (id: string) => {
    onCambiarEstado(id, 'hecho')
  }

  const handleMarcarFinalizado = (id: string) => {
    onCambiarEstado(id, 'finalizado')
  }

  const renderActions = (pedido: Pedido) => {
    switch (pedido.estado) {
      case 'recibido':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnCocina}
              onClick={(e) => { e.stopPropagation(); handleReciboCocina(String(pedido.id)) }}
            >
              ENVIAR A COCINA
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(String(pedido.id)) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'pendiente':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnEstadoPendiente}
              onClick={(e) => { e.stopPropagation(); handleCambiarEstado(String(pedido.id)) }}
            >
              MARCAR LISTO
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(String(pedido.id)) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'hecho':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnEstadoHecho}
              onClick={(e) => { e.stopPropagation(); handleMarcarFinalizado(String(pedido.id)) }}
            >
              MARCAR FINALIZADO
            </button>
            <button className={styles.btnCancelar} onClick={(e) => { e.stopPropagation(); setConfirmCancelId(String(pedido.id)) }}>
              CANCELAR
            </button>
          </div>
        )
      case 'finalizado':
        if (pedido.factura) {
          return (
            <div className={styles.cardActionsFinalizado}>
              <span className={styles.badgePagado}>COBRADO</span>
            </div>
          )
        }
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnCobrar}
              onClick={(e) => { e.stopPropagation(); setPedidoAFacturar(pedido) }}
            >
              COBRAR
            </button>
          </div>
        )
      default:
        return null
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
            className={`${styles.card} ${pedido.estado === 'finalizado' ? styles.cardFinalizado : ''}`}
            onClick={() => setDetailPedido(pedido)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.mesaName}>
                  {pedido.mesa?.nombre?.toUpperCase() ?? `MESA ${pedido.mesaId}`}
                </span>
                <span className={styles.hora}>&#x1F550; {new Date(pedido.creadoEn).toLocaleTimeString()}</span>
              </div>
              <span className={BADGE_CLASS[pedido.estado] ?? styles.badge}>{BADGE_LABEL[pedido.estado] ?? pedido.estado.toUpperCase()}</span>
              <div className={styles.headerRight}>
                <span className={styles.turno}>Turno #{pedido.turno}</span>
                <span className={styles.id}>ID: #{pedido.id}</span>
              </div>
            </div>

            <div className={styles.cardDivider} />

            <span className={styles.itemsTitle}>ÍTEMS EN COMANDA</span>

            <div className={styles.itemsScroll}>
              {pedido.detalles.map((d) => (
                <div key={d.id} className={styles.itemRow}>
                  <span className={styles.itemName}>{d.producto.nombre.toUpperCase()}</span>
                  <span className={styles.itemCant}>Cant: {d.cantidad}</span>
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
        <DetallePedidoSimple pedido={detailPedido} onClose={() => setDetailPedido(null)} />
      )}

      {pedidoAFacturar && (
        <FacturaModal
          pedido={pedidoAFacturar}
          onClose={() => {
            setPedidoAFacturar(null)
          }}
        />
      )}
    </div>
  )
}

export default ColaDeComandasPendientes

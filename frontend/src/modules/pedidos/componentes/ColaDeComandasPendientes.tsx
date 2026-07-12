import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import type { Pedido } from '../data/pedidos'
import { imprimirCocina } from '../data/pedidos'
import DetallePedidoModal from './DetallePedidoModal'
import FacturaModal from './FacturaModal'
import { useError } from '@/context/ErrorContext'
import styles from './ColaDeComandasPendientes.module.css'

interface ColaDeComandasPendientesProps {
  pedidos: Pedido[]
  onCancelar: (id: string) => void
  onCambiarEstado: (id: string, estado: string) => void
  emptyMessage?: string
  emptyHint?: string
  isAdmin?: boolean
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

function ColaDeComandasPendientes({ pedidos, onCancelar, onCambiarEstado, emptyMessage, emptyHint, isAdmin = true }: ColaDeComandasPendientesProps) {
  const { showError } = useError()
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

  const imprimirCocinaMut = useMutation({
    mutationFn: imprimirCocina,
    onError: showError,
  })

  const handleReciboCocina = (id: string) => {
    onCambiarEstado(id, 'pendiente')
    imprimirCocinaMut.mutate(Number(id))
  }

  const handleCambiarEstado = (id: string) => {
    onCambiarEstado(id, 'hecho')
  }

  const handleMarcarFinalizado = (id: string) => {
    onCambiarEstado(id, 'finalizado')
  }

  const renderActions = (pedido: Pedido) => {
    if (!isAdmin) return null
    switch (pedido.estado) {
      case 'recibido':
        return (
          <div className={styles.cardActions}>
            <button
              className={styles.btnCocina}
              onClick={(e) => { e.stopPropagation(); handleReciboCocina(String(pedido.id)) }}
            >
              GENERAR RECIBO COCINA
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
              CAMBIAR ESTADO PEDIDO
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
              onClick={(e) => { e.stopPropagation(); setPedidoAFacturar(pedido) }}
            >
              GENERAR FACTURA PAGO
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
                  {(pedido as any).esCuentaSeparada ? <span className={styles.separadaLabel}>SEPARADA</span> : null}
                  {(pedido as any).esFusion ? <span className={styles.separadaLabel}>FUSIONADA</span> : null}
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
        <DetallePedidoModal pedido={detailPedido} onClose={() => setDetailPedido(null)} />
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

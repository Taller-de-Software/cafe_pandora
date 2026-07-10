import { useEffect } from 'react'
import type { Pedido } from '../data/pedidos'
import styles from './DetallePedidoSimple.module.css'

interface DetallePedidoSimpleProps {
  pedido: Pedido
  onClose: () => void
}

const BADGE_CLASS: Record<string, string> = {
  recibido: styles.badgeRecibido,
  pendiente: styles.badgePendiente,
  hecho: styles.badgeHecho,
  finalizado: styles.badgeFinalizado,
}

const BADGE_LABEL: Record<string, string> = {
  recibido: 'RECIBIDO',
  pendiente: 'PENDIENTE',
  hecho: 'HECHO',
  finalizado: 'FINALIZADO',
  cancelado: 'CANCELADO',
}

function DetallePedidoSimple({ pedido, onClose }: DetallePedidoSimpleProps) {
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

  const subtotal = pedido.total ?? pedido.detalles.reduce((acc, d) => acc + d.precioUnitario * d.cantidad, 0)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaBadge}>{pedido.mesa?.nombre?.replace(/\D/g, '') || '?'}</div>
            <div className={styles.headerInfo}>
              <h2 className={styles.headerTitle}>{pedido.mesa?.nombre?.toUpperCase() ?? `MESA ${pedido.mesaId}`}</h2>
              <span className={styles.headerMeta}>Pedido #{pedido.id} &middot; Turno #{pedido.turno}</span>
            </div>
          </div>
          <span className={`${styles.badgeEstado} ${BADGE_CLASS[pedido.estado] ?? ''}`}>
            {BADGE_LABEL[pedido.estado] ?? pedido.estado.toUpperCase()}
          </span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>MESA</span>
              <span className={styles.infoValue}>{pedido.mesa?.nombre ?? `Mesa ${pedido.mesaId}`}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>TURNO</span>
              <span className={styles.infoValue}>#{pedido.turno}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>ROL</span>
              <span className={styles.infoValue}>{pedido.usuario?.rol?.toUpperCase() ?? '—'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>HORA</span>
              <span className={styles.infoValue}>{new Date(pedido.creadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div>
            <span className={styles.sectionTitle}>ÍTEMS</span>
            <div className={styles.itemsList}>
              {pedido.detalles.map((d) => (
                <div key={d.id} className={styles.itemRow}>
                  <div className={styles.itemLeft}>
                    <span className={styles.itemName}>{d.producto.nombre}</span>
                    {d.notas && <span className={styles.itemNotas}>{d.notas}</span>}
                  </div>
                  <div className={styles.itemRight}>
                    <span className={styles.itemCant}>x{d.cantidad}</span>
                    <span className={styles.itemPrecio}>${(d.precioUnitario * d.cantidad).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total</span>
            <span className={styles.totalValor}>${subtotal.toLocaleString('es-CL')}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.btnCerrar} onClick={onClose}>CERRAR</button>
        </div>
      </div>
    </div>
  )
}

export default DetallePedidoSimple

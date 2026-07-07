import { useState, useEffect } from 'react'
import type { PedidoPendiente } from '@/types/PedidoPendiente'
import styles from './PedidosPendientesView.module.css'

interface PedidosPendientesViewProps {
  pedidos: PedidoPendiente[]
  onCancelar: (id: string) => void
}

function PedidosPendientesView({ pedidos, onCancelar }: PedidosPendientesViewProps) {
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  useEffect(() => {
    if (!confirmCancelId) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmCancelId(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [confirmCancelId])

  if (pedidos.length === 0) {
    return (
      <div>
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>&#x1F550; COLA DE COMANDAS PENDIENTES</h2>
          <p className={styles.headerDesc}>Control de despachos en cocina y barra ordenados por orden de llegada.</p>
        </div>
        <div className={styles.empty}>
          <p>No hay pedidos pendientes</p>
          <p className={styles.emptyHint}>Confirme un pedido desde "Nuevo Pedido" para que aparezca aquí.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>&#x1F550; COLA DE COMANDAS PENDIENTES</h2>
        <p className={styles.headerDesc}>Control de despachos en cocina y barra ordenados por orden de llegada.</p>
      </div>
      <div className={styles.grid}>
        {pedidos.map((pedido) => (
          <div key={pedido.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.headerLeft}>
                <span className={styles.mesaName}>{pedido.mesa.toUpperCase()}</span>
                <span className={styles.hora}>&#x1F550; {pedido.horaCreacion}</span>
              </div>
              <span className={styles.badge}>{pedido.estado}</span>
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

            <div className={styles.cardActions}>
              <button className={styles.btnCocina} onClick={() => console.log('Recibo cocina:', pedido.id)}>
                GENERAR RECIBO<br />COCINA
              </button>
              <button className={styles.btnCancelar} onClick={() => setConfirmCancelId(pedido.id)}>
                CANCELAR
              </button>
            </div>
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
    </div>
  )
}

export default PedidosPendientesView

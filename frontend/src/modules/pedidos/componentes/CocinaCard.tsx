import type { Pedido } from '@modules/pedidos/data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import styles from './CocinaCard.module.css'

const displayLabels: Record<string, string> = {
  recibido: 'Pendiente',
  pendiente: 'Preparando',
  hecho: 'Listo',
  finalizado: 'Entregado',
  cancelado: 'Cancelado',
}

interface CocinaCardProps {
  pedido: Pedido
  onAvanzar: (pedido: Pedido) => void
}

function CocinaCard({ pedido, onAvanzar }: CocinaCardProps) {
  const label = displayLabels[pedido.estado] ?? pedido.estado
  const isFinalState = pedido.estado === 'finalizado' || pedido.estado === 'cancelado'

  return (
    <div className={`${styles.card} ${styles[pedido.estado] ?? ''}`}>
      <div className={styles.header}>
        <span className={styles.mesa}>{pedido.mesa.nombre}</span>
        <span className={styles.turno}>Turno #{pedido.turno}</span>
      </div>
      <span className={styles.estado}>{label}</span>
      <ul className={styles.items}>
        {pedido.detalles.map((d) => (
          <li key={d.id} className={styles.detalle}>
            <span>{d.cantidad}x {d.producto.nombre}</span>
            {d.notas && <span className={styles.notas}>{d.notas}</span>}
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <span className={styles.total}>${formatearNumero(pedido.total ?? 0)}</span>
        {!isFinalState && (
          <button className={styles.advanceBtn} onClick={() => onAvanzar(pedido)}>
            {pedido.estado === 'recibido' ? 'Cocinar' : pedido.estado === 'pendiente' ? 'Listo' : 'Entregar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default CocinaCard

import type { Pedido, EstadoPedido } from '../data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import styles from './TarjetaPedido.module.css'

interface TarjetaPedidoProps {
  pedido: Pedido
  selected: boolean
  onSelect: () => void
}

const colorMap: Record<EstadoPedido, string> = {
  recibido: styles.recibido,
  pendiente: styles.pendiente,
  hecho: styles.hecho,
  finalizado: styles.finalizado,
  cancelado: styles.cancelado,
}

function TarjetaPedido({ pedido, selected, onSelect }: TarjetaPedidoProps) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.info}>
        <span className={styles.mesa}>{pedido.mesa.nombre}</span>
        <span className={styles.turno}>Turno #{pedido.turno}</span>
      </div>
      <div className={styles.info} style={{ textAlign: 'right' }}>
        <span className={`${styles.badge} ${colorMap[pedido.estado]}`}>
          {pedido.estado}
        </span>
        {pedido.total != null && (
          <span className={styles.total}>${formatearNumero(pedido.total)}</span>
        )}
      </div>
    </div>
  )
}

export default TarjetaPedido

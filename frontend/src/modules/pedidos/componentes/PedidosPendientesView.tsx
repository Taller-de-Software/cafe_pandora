import type { PedidoPendiente } from '@/types/PedidoPendiente'
import ColaDeComandasPendientes from './ColaDeComandasPendientes'
import styles from './PedidosPendientesView.module.css'

interface PedidosPendientesViewProps {
  pedidos: PedidoPendiente[]
  onCancelar: (id: string) => void
  onCambiarEstado: (id: string, estado: PedidoPendiente['estado']) => void
}

function PedidosPendientesView({ pedidos, onCancelar, onCambiarEstado }: PedidosPendientesViewProps) {
  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.headerTitle}>&#x1F550; COLA DE COMANDAS PENDIENTES</h2>
          <span className={styles.orderCounter}>{pedidos.length} Pedidos</span>
        </div>
        <p className={styles.headerDesc}>Control de despachos en cocina y barra ordenados por orden de llegada.</p>
      </div>
      <ColaDeComandasPendientes
        pedidos={pedidos}
        onCancelar={onCancelar}
        onCambiarEstado={onCambiarEstado}
      />
    </div>
  )
}

export default PedidosPendientesView

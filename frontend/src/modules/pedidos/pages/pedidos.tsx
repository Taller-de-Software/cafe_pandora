import { useState } from 'react'
import NuevoPedidoView from '../componentes/NuevoPedidoView'
import PedidosPendientesView from '../componentes/PedidosPendientesView'
import { usePedidos } from '../context/PedidosContext'
import styles from './pedidos.module.css'

type Tab = 'nuevo' | 'pendientes'

function Pedidos() {
  const [tab, setTab] = useState<Tab>('nuevo')
  const { pedidosPendientes, agregarPedido, eliminarPedido } = usePedidos()

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'nuevo' ? styles.tabActive : ''}`}
          onClick={() => setTab('nuevo')}
        >
          Nuevo Pedido
        </button>
        <button
          className={`${styles.tab} ${tab === 'pendientes' ? styles.tabActive : ''}`}
          onClick={() => setTab('pendientes')}
        >
          Pedidos Pendientes
          {pedidosPendientes.length > 0 && (
            <span className={styles.badge}>{pedidosPendientes.length}</span>
          )}
        </button>
      </div>

      {tab === 'nuevo' && (
        <NuevoPedidoView onConfirmarPedido={agregarPedido} />
      )}

      {tab === 'pendientes' && (
        <PedidosPendientesView
          pedidos={pedidosPendientes}
          onCancelar={eliminarPedido}
        />
      )}
    </div>
  )
}

export default Pedidos

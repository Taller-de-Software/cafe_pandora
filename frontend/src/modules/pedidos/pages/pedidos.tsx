import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
import { listarPedidos } from '../data/pedidos'
import NuevoPedidoView from '../componentes/NuevoPedidoView'
import PedidosPendientesView from '../componentes/PedidosPendientesView'
import styles from './pedidos.module.css'

type Tab = 'nuevo' | 'pendientes'

function Pedidos() {
  const [tab, setTab] = useState<Tab>('nuevo')
  usePedidosSocket()

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: () => listarPedidos(),
    refetchInterval: 10_000,
  })

  const pedidosActivos = pedidos.filter((p) => p.estado !== 'finalizado' && p.estado !== 'cancelado')

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link to="/dashboard" className={styles.breadcrumbLink}>← Volver al Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>PEDIDOS</span>
      </div>

      <div className={styles.moduleCard}>
        <div className={styles.moduleIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className={styles.moduleInfo}>
          <h1 className={styles.moduleTitle}>PEDIDOS</h1>
          <p className={styles.moduleDesc}>Acceda a los servicios de pedidos de Café Pandora.</p>
        </div>
      </div>

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
          {pedidosActivos.length > 0 && (
            <span className={styles.badge}>{pedidosActivos.length}</span>
          )}
        </button>
      </div>

      {tab === 'nuevo' && <NuevoPedidoView />}

      {tab === 'pendientes' && <PedidosPendientesView />}
    </div>
  )
}

export default Pedidos

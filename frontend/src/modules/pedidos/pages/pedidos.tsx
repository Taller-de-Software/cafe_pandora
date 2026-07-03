import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PosScreen from '../componentes/PosScreen'
import ListaPedidos from '../componentes/ListaPedidos'
import DetallePedido from '../componentes/DetallePedido'
import FormularioPedido from '../componentes/FormularioPedido'
import { listarPedidos, obtenerPedido } from '../data/pedidos'
import styles from './pedidos.module.css'

type Tab = 'mesas' | 'lista'

function Pedidos() {
  const [tab, setTab] = useState<Tab>('mesas')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: pedidos = [], isLoading: listaCargando, isError: listaError } = useQuery({
    queryKey: ['pedidos', estadoFiltro],
    queryFn: () => listarPedidos(estadoFiltro ? { estado: estadoFiltro } : undefined),
    enabled: tab === 'lista',
  })

  const { data: detalle, isLoading: detalleCargando, isError: detalleError } = useQuery({
    queryKey: ['pedidos', selectedId],
    queryFn: () => obtenerPedido(selectedId!),
    enabled: selectedId != null,
  })

  async function handleCreated() {
    setShowForm(false)
    setSelectedId(null)
    queryClient.invalidateQueries({ queryKey: ['pedidos'] })
  }

  return (
    <div>
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'mesas' ? styles.tabActive : ''}`}
          onClick={() => setTab('mesas')}
        >
          Mesas / Nuevo Pedido
        </button>
        <button
          className={`${styles.tab} ${tab === 'lista' ? styles.tabActive : ''}`}
          onClick={() => setTab('lista')}
        >
          Lista de Pedidos
        </button>
      </div>

      {tab === 'mesas' && (
        <div className={styles.posContainer}>
          <PosScreen />
        </div>
      )}

      {tab === 'lista' && (
        <div className={styles.layout}>
          <div className={styles.listPanel}>
            {listaCargando && <p>Cargando pedidos...</p>}
            {listaError && <p>Error al cargar pedidos</p>}
            {!listaCargando && !listaError && (
              <ListaPedidos
                pedidos={pedidos}
                selectedId={selectedId}
                estadoFiltro={estadoFiltro}
                onEstadoFiltro={setEstadoFiltro}
                onSelect={setSelectedId}
                onNew={() => setShowForm(true)}
              />
            )}
          </div>
          <div className={styles.detailPanel}>
            {detalleCargando && <p>Cargando detalle...</p>}
            {detalleError && <p>Error al cargar detalle</p>}
            {detalle && !detalleCargando && !detalleError && (
              <DetallePedido
                pedido={detalle}
                onUpdate={() => {
                  queryClient.invalidateQueries({ queryKey: ['pedidos', selectedId] })
                  queryClient.invalidateQueries({ queryKey: ['pedidos', estadoFiltro] })
                }}
              />
            )}
          </div>

          {showForm && (
            <FormularioPedido onSave={handleCreated} onCancel={() => setShowForm(false)} />
          )}
        </div>
      )}
    </div>
  )
}

export default Pedidos

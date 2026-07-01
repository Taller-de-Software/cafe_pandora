import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ListaPedidos from '../componentes/ListaPedidos'
import DetallePedido from '../componentes/DetallePedido'
import FormularioPedido from '../componentes/FormularioPedido'
import { listarPedidos, obtenerPedido } from '../data/pedidos'
import styles from './pedidos.module.css'

function Pedidos() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: pedidos = [] } = useQuery({
    queryKey: ['pedidos', estadoFiltro],
    queryFn: () => listarPedidos(estadoFiltro ? { estado: estadoFiltro } : undefined),
  })

  const { data: detalle } = useQuery({
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
    <div className={styles.layout}>
      <div className={styles.listPanel}>
        <ListaPedidos
          pedidos={pedidos}
          selectedId={selectedId}
          estadoFiltro={estadoFiltro}
          onEstadoFiltro={setEstadoFiltro}
          onSelect={setSelectedId}
          onNew={() => setShowForm(true)}
        />
      </div>
      <div className={styles.detailPanel}>
        {detalle && (
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
  )
}

export default Pedidos

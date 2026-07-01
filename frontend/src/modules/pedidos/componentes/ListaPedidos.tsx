import type { Pedido } from '../data/pedidos'
import TarjetaPedido from './TarjetaPedido'
import styles from './ListaPedidos.module.css'

interface ListaPedidosProps {
  pedidos: Pedido[]
  selectedId: number | null
  estadoFiltro: string
  onEstadoFiltro: (estado: string) => void
  onSelect: (id: number) => void
  onNew: () => void
}

const estados: { label: string; value: string }[] = [
  { label: 'Todos', value: '' },
  { label: 'Recibido', value: 'recibido' },
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Hecho', value: 'hecho' },
  { label: 'Finalizado', value: 'finalizado' },
  { label: 'Cancelado', value: 'cancelado' },
]

function ListaPedidos({ pedidos, selectedId, estadoFiltro, onEstadoFiltro, onSelect, onNew }: ListaPedidosProps) {
  return (
    <div>
      <div className={styles.filters}>
        <select value={estadoFiltro} onChange={(e) => onEstadoFiltro(e.target.value)}>
          {estados.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <button className={styles.newBtn} onClick={onNew}>+ Nuevo Pedido</button>
      </div>

      <div className={styles.list}>
        {pedidos.length === 0 && (
          <p className={styles.empty}>No hay pedidos</p>
        )}
        {pedidos.map((p) => (
          <TarjetaPedido
            key={p.id}
            pedido={p}
            selected={p.id === selectedId}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ListaPedidos

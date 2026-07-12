import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarPedidos, cambiarEstado } from '@modules/pedidos/data/pedidos'
import type { Pedido, EstadoPedido } from '@modules/pedidos/data/pedidos'
import { useError } from '@/context/ErrorContext'
import CocinaCard from './CocinaCard'
import styles from './CocinaKanban.module.css'

function CocinaKanban() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['pedidos-pendientes'],
    queryFn: () => listarPedidos({ estado: 'recibido' }),
    refetchInterval: 10_000,
  })

  const { data: cocinando = [] } = useQuery({
    queryKey: ['pedidos-cocinando'],
    queryFn: () => listarPedidos({ estado: 'pendiente' }),
    refetchInterval: 10_000,
  })

  const { data: listos = [] } = useQuery({
    queryKey: ['pedidos-listos'],
    queryFn: () => listarPedidos({ estado: 'hecho' }),
    refetchInterval: 10_000,
  })

  const avanzarMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-cocinando'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-listos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Estado del pedido actualizado')
    },
    onError: showError,
  })

  function avanzar(pedido: Pedido) {
    const nextState: Record<string, EstadoPedido> = {
      recibido: 'pendiente',
      pendiente: 'hecho',
      hecho: 'finalizado',
    }
    const next = nextState[pedido.estado]
    if (next) {
      avanzarMut.mutate({ id: pedido.id, estado: next })
    }
  }

  function renderColumn(title: string, color: string, items: Pedido[]) {
    return (
      <div className={styles.column}>
        <h3 className={styles.colTitle} style={{ borderColor: color }}>{title} ({items.length})</h3>
        <div className={styles.colBody}>
          {items.length === 0 ? (
            <p className={styles.empty}>Sin pedidos</p>
          ) : (
            items.map((p) => <CocinaCard key={p.id} pedido={p} onAvanzar={avanzar} />)
          )}
        </div>
      </div>
    )
  }

  if (isLoading) return <div className={styles.loading}>Cargando pedidos...</div>
  if (isError) return <div className={styles.error}>Error al cargar pedidos</div>

  return (
    <div className={styles.layout}>
      {renderColumn('Pendientes', '#fbbf24', pedidos)}
      {renderColumn('Preparando', '#f97316', cocinando)}
      {renderColumn('Listos', '#22c55e', listos)}
    </div>
  )
}

export default CocinaKanban

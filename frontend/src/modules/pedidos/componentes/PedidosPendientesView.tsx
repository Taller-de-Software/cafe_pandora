import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarPedidos, cambiarEstado, cancelarPedido } from '../data/pedidos'
import type { Pedido, EstadoPedido } from '../data/pedidos'
import { useError } from '@/context/ErrorContext'
import { useAuth } from '@modules/auth/context/useAuth'
import ColaDeComandasPendientes from './ColaDeComandasPendientes'
import styles from './PedidosPendientesView.module.css'

function PedidosPendientesView() {
  const { user } = useAuth()
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: () => listarPedidos(),
    refetchInterval: 10_000,
  })

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Estado del pedido actualizado')
    },
    onError: showError,
  })

  const cancelarMut = useMutation({
    mutationFn: cancelarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Pedido cancelado exitosamente')
    },
    onError: showError,
  })

  const pedidosActivos = pedidos.filter((p) => p.estado !== 'cancelado' && !p.factura)

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h2 className={styles.headerTitle}>COLA DE COMANDAS PENDIENTES</h2>
          <span className={styles.orderCounter}>{pedidosActivos.length} Pedidos</span>
        </div>
        <p className={styles.headerDesc}>Control de despachos en cocina y barra ordenados por orden de llegada.</p>
      </div>
      {isLoading && <p className={styles.headerDesc}>Cargando pedidos...</p>}
      {isError && <p className={styles.headerDesc}>Error al cargar pedidos</p>}
      {!isLoading && !isError && (
        <ColaDeComandasPendientes
          pedidos={pedidosActivos}
          isAdmin={user?.rol === 'administrador'}
          onCancelar={(id) => cancelarMut.mutate(Number(id))}
          onCambiarEstado={(id, estado) => {
            const apiEstado: Record<string, EstadoPedido> = {
              RECIBIDO: 'recibido',
              PENDIENTE: 'pendiente',
              HECHO: 'hecho',
              FINALIZADO: 'finalizado',
            }
            const mapped = apiEstado[estado] ?? estado.toLowerCase() as EstadoPedido
            cambiarEstadoMut.mutate({ id: Number(id), estado: mapped })
          }}
        />
      )}
    </div>
  )
}

export default PedidosPendientesView

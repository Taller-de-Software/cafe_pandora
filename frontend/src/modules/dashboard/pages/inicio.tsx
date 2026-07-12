import { useAuth } from '@modules/auth/context/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { listarPedidos, cambiarEstado, cancelarPedido } from '@modules/pedidos/data/pedidos'
import type { EstadoPedido } from '@modules/pedidos/data/pedidos'
import { useError } from '@/context/ErrorContext'
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
import ColaDeComandasPendientes from '@modules/pedidos/componentes/ColaDeComandasPendientes'
import styles from './inicio.module.css'

function Inicio() {
  usePedidosSocket()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showError } = useError()
  const queryClient = useQueryClient()

  const { data: pedidos = [], isLoading, isError } = useQuery({
    queryKey: ['pedidos-activos'],
    queryFn: () => listarPedidos(),
    refetchInterval: 10_000,
    onError: showError,
  })

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    },
    onError: showError,
  })

  const cancelarMut = useMutation({
    mutationFn: cancelarPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    },
    onError: showError,
  })

  const pedidosActivos = pedidos.filter((p) => p.estado !== 'cancelado' && !p.factura)

  const hoy = new Date()
  const diaSemana = hoy.toLocaleDateString('es-MX', { weekday: 'long' })
  const fecha = hoy.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })

  const rol = user?.rol ?? 'Usuario'
  const rolCapitalizado = rol.charAt(0).toUpperCase() + rol.slice(1)
  const total = pedidosActivos.length

  return (
    <div className={styles.page}>
      {/* Top card: service status + summary */}
      <div className={styles.topCard}>
        <div className={styles.topLeft}>
          <div className={styles.serviceRow}>
            <span className={styles.serviceBadge}>SERVICIO EN VIVO</span>
            <span className={styles.fechaActual}>{diaSemana}, {fecha}</span>
          </div>
          <h2 className={styles.saludo}>Hola, {rolCapitalizado}!</h2>
          <p className={styles.descripcion}>
            Tienes {total} pedido{total !== 1 ? 's' : ''} pendiente{total !== 1 ? 's' : ''} por atender.
            Revisa las comandas pendientes o dirígete a caja para facturar.
          </p>
        </div>
        <div className={styles.topRight}>
          <div className={styles.resumenCard}>
            <svg className={styles.resumenIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <div className={styles.resumenText}>
              <span className={styles.resumenTitle}>COMANDAS EN COLA</span>
              <span className={styles.resumenCount}>{total} pedido{total !== 1 ? 's' : ''} por atender</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders panel */}
      <div className={styles.ordersCard}>
        <div className={styles.quickAccess}>
          <span className={styles.quickTitle}>ACCESO RÁPIDO A PEDIDOS PENDIENTES</span>
          <button className={styles.nuevoPedidoBtn} onClick={() => navigate('/dashboard/pedidos')}>
            + NUEVO PEDIDO
          </button>
        </div>

        <div className={styles.queueSection}>
          <h2 className={styles.queueTitle}>COLA DE COMANDAS PENDIENTES</h2>
          <p className={styles.queueDesc}>Control de despachos en cocina y barra ordenados por orden de llegada.</p>
          {isLoading && <p className={styles.queueDesc}>Cargando pedidos...</p>}
          {isError && <p className={styles.queueDesc}>Error al cargar pedidos</p>}
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
      </div>
    </div>
  )
}

export default Inicio

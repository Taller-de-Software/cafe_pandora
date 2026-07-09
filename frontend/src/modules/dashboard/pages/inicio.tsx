import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@modules/auth/context/useAuth'
import { usePedidosSocket } from '@/hooks/usePedidosSocket'
import PagoPedido from '@modules/pedidos/componentes/PagoPedido'
import { listarPedidos, cambiarEstado } from '@modules/pedidos/data/pedidos'
import type { Pedido, EstadoPedido } from '@modules/pedidos/data/pedidos'
import { useError } from '@/context/ErrorContext'
import { formatearNumero, formatearFecha } from '@/utils/formatear'
import styles from './inicio.module.css'

const estadoLabels: Record<string, string> = {
  recibido: 'Recibido',
  pendiente: 'Pendiente',
  hecho: 'Hecho',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

const estadoColors: Record<string, string> = {
  recibido: '#fbbf24',
  pendiente: '#f97316',
  hecho: '#22c55e',
}

const buttonLabels: Record<string, string> = {
  recibido: 'Cocinar',
  pendiente: 'Hecho',
  hecho: 'Finalizar',
}

const nextState: Record<string, EstadoPedido> = {
  recibido: 'pendiente',
  pendiente: 'hecho',
  hecho: 'finalizado',
}

function Inicio() {
  usePedidosSocket()
  const { showError } = useError()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [pagoPedido, setPagoPedido] = useState<Pedido | null>(null)

  const { data: recibidos = [] } = useQuery({
    queryKey: ['inicio-recibido'],
    queryFn: () => listarPedidos({ estado: 'recibido' }),
    refetchInterval: 10_000,
  })

  const { data: pendientes = [] } = useQuery({
    queryKey: ['inicio-pendiente'],
    queryFn: () => listarPedidos({ estado: 'pendiente' }),
    refetchInterval: 10_000,
  })

  const { data: hechos = [] } = useQuery({
    queryKey: ['inicio-hecho'],
    queryFn: () => listarPedidos({ estado: 'hecho' }),
    refetchInterval: 10_000,
  })

  const avanzarMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) =>
      cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inicio-recibido'] })
      queryClient.invalidateQueries({ queryKey: ['inicio-pendiente'] })
      queryClient.invalidateQueries({ queryKey: ['inicio-hecho'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    },
    onError: showError,
  })

  function avanzar(pedido: Pedido) {
    const next = nextState[pedido.estado]
    if (next) {
      avanzarMut.mutate({ id: pedido.id, estado: next })
    }
  }

  return (
    <div>
      <div className={styles.welcome}>
        <h2>Bienvenido, {user?.rol ?? 'Usuario'}</h2>
        <p>Pedidos en cocina y pagos pendientes</p>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Cocina</h3>
        <div className={styles.kanbanLayout}>
          {(['recibido', 'pendiente', 'hecho'] as const).map((estado) => (
            <div key={estado} className={styles.kanbanColumn}>
              <h4
                className={styles.kanbanTitle}
                style={{ borderColor: estadoColors[estado] }}
              >
                {estadoLabels[estado]} (
                {
                  estado === 'recibido'
                    ? recibidos.length
                    : estado === 'pendiente'
                      ? pendientes.length
                      : hechos.length
                }
                )
              </h4>
              <div className={styles.kanbanBody}>
                {(estado === 'recibido'
                  ? recibidos
                  : estado === 'pendiente'
                    ? pendientes
                    : hechos
                ).length === 0 ? (
                  <p className={styles.empty}>Sin pedidos</p>
                ) : (
                  (estado === 'recibido'
                    ? recibidos
                    : estado === 'pendiente'
                      ? pendientes
                      : hechos
                  ).map((pedido) => (
                    <div
                      key={pedido.id}
                      className={`${styles.card} ${styles[`card_${pedido.estado}`]}`}
                    >
                      <div className={styles.cardHeader}>
                        <span className={styles.mesaName}>
                          {pedido.mesa.nombre}
                        </span>
                        <span>
                          <span className={styles.turno}>
                            Turno #{pedido.turno}
                          </span>
                          <span className={styles.hora}>
                            {' '}· {formatearFecha(pedido.creadoEn.split('T')[0])} {pedido.creadoEn.split('T')[1]?.slice(0, 5)}
                          </span>
                        </span>
                      </div>
                      <span className={styles.estadoBadge}>
                        {estadoLabels[pedido.estado]}
                      </span>
                      <ul className={styles.items}>
                        {pedido.detalles.map((d) => (
                          <li key={d.id} className={styles.item}>
                            <span>
                              {d.cantidad}x {d.producto.nombre}
                            </span>
                            <span className={styles.precioUnitario}>
                              ${formatearNumero(d.precioUnitario)}
                            </span>
                            {d.notas && (
                              <span className={styles.notas}>{d.notas}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className={styles.cardFooter}>
                        <span className={styles.total}>
                          ${formatearNumero(pedido.total ?? 0)}
                        </span>
                        <div className={styles.cardActions}>
                          {pedido.estado === 'hecho' && (
                            <button
                              className={styles.cobrarBtnSmall}
                              onClick={() => setPagoPedido(pedido)}
                            >
                              Cobrar
                            </button>
                          )}
                          <button
                            className={styles.advanceBtn}
                            onClick={() => avanzar(pedido)}
                          >
                            {buttonLabels[pedido.estado]}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pagoPedido && (
        <PagoPedido
          pedido={pagoPedido}
          onClose={() => setPagoPedido(null)}
          onPagoExitoso={() => setPagoPedido(null)}
        />
      )}
    </div>
  )
}

export default Inicio

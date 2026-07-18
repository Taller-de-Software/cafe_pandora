import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMesasCompletas, crearReserva, type MesaCompleta } from '../data/pos'
import { isReservaProxima } from '../types/estados-mesa'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import { useReservas } from '../context/ReservasContext'
import NewTableModal from './NewTableModal'
import ReservationModal from './ReservationModal'
import ReservarMesaModal from './ReservarMesaModal'
import EditarReservasModal from './EditarReservasModal'
import TomaPedidoView from './TomaPedidoView'
import DetallePedidoModal from './detalle-pedido/DetallePedidoModal'
import styles from './NuevoPedidoView.module.css'

const STATUS_LABELS: Record<string, string> = {
  vacia: 'VACÍA',
  ocupada: 'OCUPADA',
  por_pagar: 'POR PAGAR',
  reservada: 'RESERVADA',
  fuera_de_servicio: 'FUERA DE SERVICIO',
}

const STATUS_COLORS: Record<string, string> = {
  vacia: '#3D8B5F',
  ocupada: '#C99835',
  por_pagar: '#E07B39',
  reservada: '#5E87B8',
  fuera_de_servicio: '#9B9792',
}

interface NuevoPedidoViewProps {
  onConfirmarPedido?: (mesa: string, items: { nombre: string; cantidad: number; precioUnitario: number; subtotal: number }[], mesero: string) => void
}

const NOTIFICACION_COOLDOWN_MS = 3 * 60 * 1000
const TIMER_INTERVAL_MS = 30_000

function formatearHora(hora: string): string {
  try {
    const [hh, mm] = hora.split(':')
    const h = Number(hh)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${mm} ${ampm}`
  } catch {
    return hora
  }
}

function NuevoPedidoView({ onConfirmarPedido }: NuevoPedidoViewProps) {
  const { showError, showSuccess, showInfo } = useError()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { agregarReserva } = useReservas()
  const isAdmin = user?.rol === 'administrador'

  const [selectedMesa, setSelectedMesa] = useState<MesaCompleta | null>(null)
  const [showNewTable, setShowNewTable] = useState(false)
  const [reservaMesa, setReservaMesa] = useState<MesaCompleta | null>(null)
  const [showReservarMesa, setShowReservarMesa] = useState(false)
  const [showEditarReservas, setShowEditarReservas] = useState(false)
  const [detailPedido, setDetailPedido] = useState<MesaCompleta['pedidoActivo']>(null)
  const [, forceRender] = useState(0)
  const notificadasRef = useRef<Set<string>>(new Set())
  const mesasRef = useRef<MesaCompleta[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      forceRender((n) => n + 1)
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    }, TIMER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [queryClient])

  const { data: mesas = [], isLoading, isError } = useQuery({
    queryKey: ['mesas-completas'],
    queryFn: listarMesasCompletas,
  })
  mesasRef.current = mesas

  const reservaMutation = useMutation({
    mutationFn: crearReserva,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Reserva creada exitosamente')
      setReservaMesa(null)
      setShowReservarMesa(false)
    },
    onError: showError,
  })

  useEffect(() => {
    function checkReservas() {
      const ms = mesasRef.current
      if (!ms.length) return
      ms.forEach((m) => {
        if (!m.reserva) return
        if (!isReservaProxima(m.reserva)) return
        const key = `mesa-${m.id}-${m.reserva.id}`
        if (notificadasRef.current.has(key)) return
        notificadasRef.current.add(key)
        showInfo(
          `Tienes una reserva próxima.\n${m.nombre}\n${m.reserva.cliente}\n${formatearHora(m.reserva.hora)}\nFaltan 20 minutos.`
        )
        setTimeout(() => notificadasRef.current.delete(key), NOTIFICACION_COOLDOWN_MS)
      })
    }

    checkReservas()
    const id = setInterval(checkReservas, TIMER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [showInfo])

  if (selectedMesa) {
    return (
      <TomaPedidoView
        mesa={selectedMesa}
        onBack={() => setSelectedMesa(null)}
        onConfirmarPedido={onConfirmarPedido}
      />
    )
  }

  const mesasDisponibles = mesas.filter((m) => m.estado !== 'fuera_de_servicio')

  function handleMesaClick(mesa: MesaCompleta) {
    if (mesa.estado === 'fuera_de_servicio') return
    if (mesa.estado !== 'vacia' && mesa.pedidoActivo) {
      setDetailPedido(mesa.pedidoActivo)
      return
    }
    setSelectedMesa(mesa)
  }

  async function handleReservarMesaSave(data: {
    mesaId: number
    cliente: string
    telefono?: string
    fecha: string
    hora: string
    personas: number
    observaciones?: string
  }) {
    const mesa = mesas.find((m) => m.id === data.mesaId)
    try {
      const result = await reservaMutation.mutateAsync({
        cliente: data.cliente,
        telefono: data.telefono,
        fecha: data.fecha,
        hora: data.hora,
        personas: data.personas,
        observaciones: data.observaciones,
        mesaId: data.mesaId,
      })
      await queryClient.refetchQueries({ queryKey: ['mesas-completas'] })
      agregarReserva({
        apiId: result.id,
        mesaId: data.mesaId,
        mesaNombre: mesa?.nombre ?? `Mesa #${data.mesaId}`,
        nombreCliente: data.cliente,
        telefono: data.telefono ?? '',
        fecha: data.fecha,
        hora: data.hora,
        numeroPersonas: data.personas,
        observaciones: data.observaciones ?? '',
      })
    } catch (err) {
      showError(err)
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seleccione la Mesa</h2>
        <p className={styles.subtitle}>Elija una mesa del salón o registre una mesa alterna.</p>
      </div>

      {isLoading && <p className={styles.subtitle}>Cargando mesas...</p>}
      {isError && <p className={styles.subtitle}>Error al cargar mesas</p>}

      {!isLoading && !isError && (
        <div className={`${styles.mesasContainer} ${mesas.length > 0 ? styles.mesasContainerFilled : ''}`}>
          {mesas.map((m) => {
            const mostrarReservada = m.estado === 'vacia' && m.reserva && isReservaProxima(m.reserva)

            let statusLabel = STATUS_LABELS[m.estado] ?? m.estado.toUpperCase()
            let statusColor = STATUS_COLORS[m.estado] ?? '#9B9792'

            if (mostrarReservada) {
              statusLabel = STATUS_LABELS.reservada
              statusColor = STATUS_COLORS.reservada
            }

            return (
              <div
                key={m.id}
                className={styles.mesaCard}
                onClick={() => handleMesaClick(m)}
              >
                <span className={styles.mesaName}>{m.nombre}</span>
                <span className={styles.mesaUbicacion}>{m.ubicacion}</span>
                <span
                  className={styles.mesaBadge}
                  style={{ backgroundColor: statusColor + '18', color: statusColor, borderColor: statusColor + '30' }}
                >
                  {statusLabel}
                </span>
                {m.estado === 'ocupada' && m.pedidoActivo && (
                  <span className={styles.mesaPedido}>
                    Pedido #{m.pedidoActivo.id} — ${m.pedidoActivo.total ?? 0}
                  </span>
                )}
                {mostrarReservada && m.reserva && (
                  <span className={styles.mesaReserva}>
                    {m.reserva.cliente} — {m.reserva.hora}
                  </span>
                )}
                {m.estado !== 'vacia' && !mostrarReservada && m.reserva && isReservaProxima(m.reserva) && (
                  <span className={styles.mesaReserva}>
                    Reserva: {m.reserva.cliente} — {m.reserva.hora}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>¿No encuentra la mesa? Cree una personalizada o reserve una mesa.</p>
        <div className={styles.buttons}>
          {isAdmin && (
            <button className={styles.btnPrimary} onClick={() => setShowNewTable(true)}>
              + AGREGAR NUEVA MESA
            </button>
          )}
          <button className={styles.btnReservar} onClick={() => setShowReservarMesa(true)}>
            RESERVAR UNA MESA
          </button>
          <button className={styles.btnEditarReservas} onClick={() => setShowEditarReservas(true)}>
            EDITAR RESERVAS
          </button>
        </div>
      </div>

      {showNewTable && <NewTableModal onClose={() => setShowNewTable(false)} />}

      {reservaMesa && (
        <ReservationModal
          mesa={reservaMesa}
          onSave={async (data) => { await reservaMutation.mutateAsync(data) }}
          onClose={() => setReservaMesa(null)}
        />
      )}

      {showReservarMesa && (
        <ReservarMesaModal
          mesas={mesasDisponibles}
          onSave={handleReservarMesaSave}
          onClose={() => setShowReservarMesa(false)}
        />
      )}

      {showEditarReservas && (
        <EditarReservasModal
          mesas={mesas}
          onClose={() => setShowEditarReservas(false)}
        />
      )}

      {detailPedido && (
        <DetallePedidoModal
          pedido={detailPedido}
          onClose={() => setDetailPedido(null)}
        />
      )}
    </div>
  )
}

export default NuevoPedidoView

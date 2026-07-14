import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMesasCompletas, crearReserva, type MesaCompleta } from '../data/pos'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import { useReservas } from '../context/ReservasContext'
import NewTableModal from './NewTableModal'
import ReservationModal from './ReservationModal'
import ReservarMesaModal from './ReservarMesaModal'
import EditarReservasModal from './EditarReservasModal'
import TomaPedidoView from './TomaPedidoView'
import DetallePedidoModal from './DetallePedidoModal'
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

function NuevoPedidoView({ onConfirmarPedido }: NuevoPedidoViewProps) {
  const { showError, showSuccess } = useError()
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

  const { data: mesas = [], isLoading, isError } = useQuery({
    queryKey: ['mesas-completas'],
    queryFn: listarMesasCompletas,
  })

  const reservaMutation = useMutation({
    mutationFn: crearReserva,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Reserva creada exitosamente')
      setReservaMesa(null)
      setShowReservarMesa(false)
    },
    onError: showError,
  })

  if (selectedMesa) {
    return (
      <TomaPedidoView
        mesa={selectedMesa}
        onBack={() => setSelectedMesa(null)}
        onConfirmarPedido={onConfirmarPedido}
      />
    )
  }

  const mesasVacias = mesas.filter((m) => m.estado === 'vacia')

  function handleMesaClick(mesa: MesaCompleta) {
    if (mesa.estado === 'reservada') {
      setReservaMesa(mesa)
      return
    }
    if (mesa.estado === 'fuera_de_servicio') return
    if (mesa.estado === 'vacia') {
      setSelectedMesa(mesa)
      return
    }
    if (mesa.pedidoActivo) {
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
    notas?: string
  }) {
    const mesa = mesas.find((m) => m.id === data.mesaId)
    try {
      const result = await reservaMutation.mutateAsync({
        cliente: data.cliente,
        telefono: data.telefono,
        fecha: data.fecha,
        hora: data.hora,
        personas: data.personas,
        mesaId: data.mesaId,
      })
      agregarReserva({
        apiId: result.id,
        mesaId: data.mesaId,
        mesaNombre: mesa?.nombre ?? `Mesa #${data.mesaId}`,
        nombreCliente: data.cliente,
        telefono: data.telefono ?? '',
        fecha: data.fecha,
        hora: data.hora,
        numeroPersonas: data.personas,
        notas: data.notas ?? '',
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
            const statusLabel = STATUS_LABELS[m.estado] ?? m.estado.toUpperCase()
            const statusColor = STATUS_COLORS[m.estado] ?? '#9B9792'
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
                {m.reserva && (
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
          mesasVacias={mesasVacias}
          onSave={handleReservarMesaSave}
          onClose={() => setShowReservarMesa(false)}
        />
      )}

      {showEditarReservas && (
        <EditarReservasModal
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

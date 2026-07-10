import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMesasCompletas, crearReserva, type MesaCompleta } from '../data/pos'
import { useAuth } from '@modules/auth/context/useAuth'
import { useError } from '@/context/ErrorContext'
import NewTableModal from './NewTableModal'
import ReservationModal from './ReservationModal'
import TomaPedidoView from './TomaPedidoView'
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
  const { showError } = useError()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.rol === 'administrador'

  const [selectedMesa, setSelectedMesa] = useState<MesaCompleta | null>(null)
  const [showNewTable, setShowNewTable] = useState(false)
  const [reservaMesa, setReservaMesa] = useState<MesaCompleta | null>(null)

  const { data: mesas = [], isLoading, isError } = useQuery({
    queryKey: ['mesas-completas'],
    queryFn: listarMesasCompletas,
  })

  const reservaMutation = useMutation({
    mutationFn: crearReserva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      setReservaMesa(null)
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

  function handleMesaClick(mesa: MesaCompleta) {
    if (mesa.estado === 'reservada') {
      setReservaMesa(mesa)
      return
    }
    if (mesa.estado === 'fuera_de_servicio') return
    setSelectedMesa(mesa)
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
                {m.pedidoActivo && (
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
        <p className={styles.footerText}>¿No encuentra la mesa? Cree una nueva o reserve una existente.</p>
        <div className={styles.buttons}>
          {isAdmin && (
            <button className={styles.btnPrimary} onClick={() => setShowNewTable(true)}>
              + Agregar Nueva Mesa
            </button>
          )}
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
    </div>
  )
}

export default NuevoPedidoView

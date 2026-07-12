import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarMesasCompletas, crearReserva } from '@modules/pedidos/data/pos'
import MesaCard from './MesaCard'
import NewTableModal from './NewTableModal'
import ReservationModal from './ReservationModal'
import type { MesaCompleta } from '@modules/pedidos/data/pos'
import { useError } from '@/context/ErrorContext'
import { useAuth } from '@modules/auth/context/useAuth'
import styles from './MesaGrid.module.css'

interface MesaGridProps {
  onSelectMesa: (mesa: MesaCompleta) => void
}

function MesaGrid({ onSelectMesa }: MesaGridProps) {
  const { showError, showSuccess } = useError()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isAdmin = user?.rol === 'administrador'

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
      showSuccess('Reserva creada exitosamente')
      setReservaMesa(null)
    },
    onError: showError,
  })

  function handleClick(mesa: MesaCompleta) {
    if (mesa.estado === 'reservada') {
      setReservaMesa(mesa)
      return
    }
    if (mesa.estado === 'fuera_de_servicio') return
    onSelectMesa(mesa)
  }

  if (isLoading) return <div className={styles.loading}>Cargando mesas...</div>
  if (isError) return <div className={styles.error}>Error al cargar mesas</div>

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Mesas</h2>
        {isAdmin && (
          <button className={styles.addBtn} onClick={() => setShowNewTable(true)}>
            + Nueva Mesa
          </button>
        )}
      </div>
      <div className={styles.grid}>
        {mesas.map((m) => (
          <MesaCard key={m.id} mesa={m} onClick={handleClick} />
        ))}
      </div>

      {showNewTable && <NewTableModal onClose={() => setShowNewTable(false)} />}
      {reservaMesa && (
        <ReservationModal
          mesa={reservaMesa}
          onSave={async (data) => {
            await reservaMutation.mutateAsync(data)
          }}
          onClose={() => setReservaMesa(null)}
        />
      )}
    </div>
  )
}

export default MesaGrid

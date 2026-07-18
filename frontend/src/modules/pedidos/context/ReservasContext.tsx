import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

const RESERVAS_STORAGE_KEY = 'reservas'

export interface ReservaLocal {
  id: string
  apiId: number | null
  mesaId: number
  mesaNombre: string
  nombreCliente: string
  telefono: string
  fecha: string
  hora: string
  numeroPersonas: number
  observaciones: string
  estado: 'activa' | 'cancelada' | 'completada'
}

interface ReservasContextValue {
  reservas: ReservaLocal[]
  agregarReserva: (reserva: Omit<ReservaLocal, 'id' | 'estado'>) => void
  actualizarReserva: (id: string, data: Partial<Omit<ReservaLocal, 'id' | 'apiId'>>) => void
  cancelarReserva: (id: string) => void
  obtenerReservasActivas: () => ReservaLocal[]
}

export const ReservasContext = createContext<ReservasContextValue | null>(null)

export function ReservasProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<ReservaLocal[]>(() => {
    try {
      const raw = localStorage.getItem(RESERVAS_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(RESERVAS_STORAGE_KEY, JSON.stringify(reservas))
    } catch {}
  }, [reservas])

  const agregarReserva = useCallback((reserva: Omit<ReservaLocal, 'id' | 'estado'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    setReservas((prev) => [...prev, { ...reserva, id, estado: 'activa' }])
  }, [])

  const actualizarReserva = useCallback((id: string, data: Partial<Omit<ReservaLocal, 'id' | 'apiId'>>) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    )
  }, [])

  const cancelarReserva = useCallback((id: string) => {
    setReservas((prev) =>
      prev.map((r) => (r.id === id ? { ...r, estado: 'cancelada' } : r))
    )
  }, [])

  const obtenerReservasActivas = useCallback(() => {
    return reservas.filter((r) => r.estado === 'activa')
  }, [reservas])

  return (
    <ReservasContext.Provider value={{ reservas, agregarReserva, actualizarReserva, cancelarReserva, obtenerReservasActivas }}>
      {children}
    </ReservasContext.Provider>
  )
}

export function useReservas(): ReservasContextValue {
  const ctx = useContext(ReservasContext)
  if (!ctx) throw new Error('useReservas debe usarse dentro de ReservasProvider')
  return ctx
}

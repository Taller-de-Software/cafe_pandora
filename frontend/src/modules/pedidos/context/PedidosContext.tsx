import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { PedidoPendiente } from '@/types/PedidoPendiente'

interface PedidosContextValue {
  pedidosPendientes: PedidoPendiente[]
  agregarPedido: (mesa: string, items: { nombre: string; cantidad: number }[]) => void
  eliminarPedido: (id: string) => void
}

const PedidosContext = createContext<PedidosContextValue | null>(null)

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>([])

  const agregarPedido = useCallback(
    (mesa: string, items: { nombre: string; cantidad: number }[]) => {
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      setPedidosPendientes((prev) => {
        const turno = prev.length + 1
        const id = String(Date.now() + turno).slice(-4)
        return [...prev, { id, mesa, turno, horaCreacion: `${hh}:${mm}`, estado: 'RECIBIDO', items }]
      })
    },
    []
  )

  const eliminarPedido = useCallback((id: string) => {
    setPedidosPendientes((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return (
    <PedidosContext.Provider value={{ pedidosPendientes, agregarPedido, eliminarPedido }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}

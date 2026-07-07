import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { PedidoPendiente, ItemPedidoPendiente } from '@/types/PedidoPendiente'

const STORAGE_KEY = 'cafe-pandora-pedidos-pendientes'

function loadPedidos(): PedidoPendiente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

function savePedidos(pedidos: PedidoPendiente[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos))
  } catch {
  }
}

interface PedidosContextValue {
  pedidosPendientes: PedidoPendiente[]
  agregarPedido: (mesa: string, mesaNumero: number, items: { nombre: string; cantidad: number; precioUnitario: number }[], mesero: string) => void
  eliminarPedido: (id: string) => void
  actualizarPedido: (id: string, items: ItemPedidoPendiente[]) => void
}

const PedidosContext = createContext<PedidosContextValue | null>(null)

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>(loadPedidos)

  const agregarPedido = useCallback(
    (mesa: string, mesaNumero: number, items: { nombre: string; cantidad: number; precioUnitario: number }[], mesero: string) => {
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      setPedidosPendientes((prev) => {
        const turno = prev.length + 1
        const id = String(Date.now() + turno).slice(-4)
        return [...prev, { id, mesa, mesaNumero, turno, horaCreacion: `${hh}:${mm}`, estado: 'RECIBIDO', items, mesero }]
      })
    },
    []
  )

  const eliminarPedido = useCallback((id: string) => {
    setPedidosPendientes((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const actualizarPedido = useCallback((id: string, items: ItemPedidoPendiente[]) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, items } : p))
    )
  }, [])

  useEffect(() => {
    savePedidos(pedidosPendientes)
  }, [pedidosPendientes])

  return (
    <PedidosContext.Provider value={{ pedidosPendientes, agregarPedido, eliminarPedido, actualizarPedido }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { PedidoPendiente, ItemPedidoPendiente, CuentaSeparada } from '@/types/PedidoPendiente'

const PEDIDOS_STORAGE_KEY = 'pedidosPendientes'

interface PedidosContextValue {
  pedidosPendientes: PedidoPendiente[]
  agregarPedido: (mesa: string, items: ItemPedidoPendiente[], mesero: string) => void
  eliminarPedido: (id: string) => void
  actualizarPedido: (id: string, items: ItemPedidoPendiente[]) => void
  separarCuenta: (id: string, cuentas: CuentaSeparada[]) => void
}

const PedidosContext = createContext<PedidosContextValue | null>(null)

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>(() => {
    try {
      const raw = localStorage.getItem(PEDIDOS_STORAGE_KEY)
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
      localStorage.setItem(PEDIDOS_STORAGE_KEY, JSON.stringify(pedidosPendientes))
    } catch {}
  }, [pedidosPendientes])

  const agregarPedido = useCallback(
    (mesa: string, items: ItemPedidoPendiente[], mesero: string) => {
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      setPedidosPendientes((prev) => {
        const turno = prev.length + 1
        const id = String(Date.now() + turno).slice(-4)
        return [...prev, { id, mesa, turno, horaCreacion: `${hh}:${mm}`, estado: 'RECIBIDO', items, mesero }]
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

  const separarCuenta = useCallback((id: string, cuentas: CuentaSeparada[]) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cuentas } : p))
    )
  }, [])

  return (
    <PedidosContext.Provider value={{ pedidosPendientes, agregarPedido, eliminarPedido, actualizarPedido, separarCuenta }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}

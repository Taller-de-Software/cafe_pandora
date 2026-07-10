import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { PedidoPendiente, ItemPedidoPendiente, CuentaSeparada, Abono } from '@/types/PedidoPendiente'

const PEDIDOS_STORAGE_KEY = 'pedidosPendientes'

function normalizarItems(items: ItemPedidoPendiente[]): ItemPedidoPendiente[] {
  return items.map((item) => {
    if (!item.precioUnitario) throw new Error(`Producto "${item.nombre}" sin precio.`)
    const cantidad = item.cantidad || 0
    const subtotal = item.subtotal || item.precioUnitario * cantidad
    return { ...item, cantidad, subtotal }
  })
}

function calcularTotal(items: ItemPedidoPendiente[]): number {
  return items.reduce((sum, item) => sum + item.subtotal, 0)
}

interface PedidosContextValue {
  pedidosPendientes: PedidoPendiente[]
  agregarPedido: (mesa: string, items: ItemPedidoPendiente[], mesero: string, esCuentaSeparada?: boolean) => void
  eliminarPedido: (id: string) => void
  actualizarPedido: (id: string, items: ItemPedidoPendiente[]) => void
  separarCuenta: (id: string, cuentas: CuentaSeparada[]) => void
  cambiarMesaPedido: (id: string, newMesa: string) => void
  registrarAbono: (id: string, abono: Abono) => void
  cambiarEstado: (id: string, estado: PedidoPendiente['estado']) => void
}

const PedidosContext = createContext<PedidosContextValue | null>(null)

export function PedidosProvider({ children }: { children: ReactNode }) {
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendiente[]>(() => {
    try {
      const raw = localStorage.getItem(PEDIDOS_STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.map((p: any) => {
        const items = Array.isArray(p.items) ? normalizarItems(p.items) : []
        const total = p.total ?? calcularTotal(items)
        return { ...p, items, total }
      })
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
    (mesa: string, items: ItemPedidoPendiente[], mesero: string, esCuentaSeparada?: boolean) => {
      const itemsNorm = normalizarItems(items)
      const total = calcularTotal(itemsNorm)
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      setPedidosPendientes((prev) => {
        const turno = prev.length + 1
        const id = String(Date.now() + turno).slice(-4)
        return [...prev, { id, mesa, turno, horaCreacion: `${hh}:${mm}`, estado: 'RECIBIDO', items: itemsNorm, mesero, total, esCuentaSeparada }]
      })
    },
    []
  )

  const eliminarPedido = useCallback((id: string) => {
    setPedidosPendientes((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const actualizarPedido = useCallback((id: string, items: ItemPedidoPendiente[]) => {
    const itemsNorm = normalizarItems(items)
    const total = calcularTotal(itemsNorm)
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, items: itemsNorm, total } : p))
    )
  }, [])

  const separarCuenta = useCallback((id: string, cuentas: CuentaSeparada[]) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cuentas } : p))
    )
  }, [])

  const cambiarMesaPedido = useCallback((id: string, newMesa: string) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, mesa: newMesa } : p))
    )
  }, [])

  const registrarAbono = useCallback((id: string, abono: Abono) => {
    setPedidosPendientes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, abonos: [...(p.abonos ?? []), abono] }
          : p
      )
    )
  }, [])

  const cambiarEstado = useCallback((id: string, estado: PedidoPendiente['estado']) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado } : p))
    )
  }, [])

  return (
    <PedidosContext.Provider value={{ pedidosPendientes, agregarPedido, eliminarPedido, actualizarPedido, separarCuenta, cambiarMesaPedido, registrarAbono, cambiarEstado }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}

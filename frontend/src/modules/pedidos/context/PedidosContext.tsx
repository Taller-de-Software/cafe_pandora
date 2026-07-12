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
  actualizarPedido: (id: string, items: ItemPedidoPendiente[], extra?: { mesa?: string; mesero?: string; horaCreacion?: string; estado?: PedidoPendiente['estado'] }) => void
  separarCuenta: (id: string, itemsPorCuenta: ItemPedidoPendiente[][]) => void
  cambiarMesaPedido: (id: string, newMesa: string) => void
  unirPedidos: (id: string, targetMesa: string) => void
  registrarAbono: (id: string, abono: Abono) => void
  cambiarEstado: (id: string, estado: PedidoPendiente['estado']) => void
}

export const PedidosContext = createContext<PedidosContextValue | null>(null)

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
        return { ...p, items, total, totalAbonado: p.totalAbonado ?? 0 }
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
        return [...prev, { id, mesa, turno, horaCreacion: `${hh}:${mm}`, estado: 'RECIBIDO', items: itemsNorm, mesero, total, totalAbonado: 0, esCuentaSeparada }]
      })
    },
    []
  )

  const eliminarPedido = useCallback((id: string) => {
    setPedidosPendientes((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const actualizarPedido = useCallback((id: string, items: ItemPedidoPendiente[], extra?: { mesa?: string; mesero?: string; horaCreacion?: string; estado?: PedidoPendiente['estado'] }) => {
    const itemsNorm = normalizarItems(items)
    const total = calcularTotal(itemsNorm)
    setPedidosPendientes((prev) => {
      const exists = prev.find((p) => p.id === id)
      if (exists) {
        return prev.map((p) => (p.id === id ? { ...p, items: itemsNorm, total } : p))
      }
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      return [...prev, {
        id,
        mesa: extra?.mesa ?? '',
        turno: prev.length + 1,
        horaCreacion: extra?.horaCreacion ?? `${hh}:${mm}`,
        estado: extra?.estado ?? 'PENDIENTE',
        items: itemsNorm,
        mesero: extra?.mesero ?? '',
        total,
        totalAbonado: 0,
      }]
    })
  }, [])

  const separarCuenta = useCallback((id: string, itemsPorCuenta: ItemPedidoPendiente[][]) => {
    setPedidosPendientes((prev) => {
      const source = prev.find((p) => p.id === id)
      if (!source) return prev
      if (itemsPorCuenta.length < 2) return prev
      const ahora = new Date()
      const hh = String(ahora.getHours()).padStart(2, '0')
      const mm = String(ahora.getMinutes()).padStart(2, '0')
      const nuevos: PedidoPendiente[] = []
      for (let i = 0; i < itemsPorCuenta.length; i++) {
        const items = itemsPorCuenta[i]
        if (!items || items.length === 0) continue
        const total = calcularTotal(items)
        if (i === 0) {
          nuevos.push({ ...source, items, total, esCuentaSeparada: true, cuentas: [] })
        } else {
          const turno = prev.length + nuevos.length
          const newId = String(Date.now() + turno).slice(-4)
          nuevos.push({
            id: newId,
            mesa: source.mesa,
            turno,
            horaCreacion: `${hh}:${mm}`,
            estado: source.estado,
            items,
            mesero: source.mesero,
            total,
            totalAbonado: 0,
            esCuentaSeparada: true,
          })
        }
      }
      return prev.filter((p) => p.id !== id).concat(nuevos)
    })
  }, [])

  const cambiarMesaPedido = useCallback((id: string, newMesa: string) => {
    setPedidosPendientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, mesa: newMesa } : p))
    )
  }, [])

  const unirPedidos = useCallback((id: string, targetMesa: string) => {
    setPedidosPendientes((prev) => {
      const source = prev.find((p) => p.id === id)
      if (!source) return prev
      const target = prev.find((p) => p.mesa === targetMesa)
      if (!target) return prev
      const mergedItems = [...source.items]
      for (const targetItem of target.items) {
        const idx = mergedItems.findIndex((i) => i.nombre === targetItem.nombre)
        if (idx >= 0) {
          const newCant = Math.max(mergedItems[idx].cantidad, 0) + Math.max(targetItem.cantidad, 0)
          mergedItems[idx] = { ...mergedItems[idx], cantidad: newCant, subtotal: newCant * mergedItems[idx].precioUnitario }
        } else {
          mergedItems.push({ ...targetItem })
        }
      }
      const total = calcularTotal(mergedItems)
      return prev
        .map((p) =>
          p.id === id ? { ...p, items: mergedItems, total, esFusion: true } : p
        )
        .filter((p) => p.id !== target.id)
    })
  }, [])

  const registrarAbono = useCallback((id: string, abono: Abono) => {
    setPedidosPendientes((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, abonos: [...(p.abonos ?? []), abono], totalAbonado: (p.totalAbonado ?? 0) + abono.monto }
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
    <PedidosContext.Provider value={{ pedidosPendientes, agregarPedido, eliminarPedido, actualizarPedido, separarCuenta, cambiarMesaPedido, unirPedidos, registrarAbono, cambiarEstado }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidos(): PedidosContextValue {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidos debe usarse dentro de PedidosProvider')
  return ctx
}

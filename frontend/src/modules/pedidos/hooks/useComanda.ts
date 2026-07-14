import { useState, useCallback } from 'react'
import type { ItemComanda } from '../types/tipos-comanda'

interface UseComandaOptions {
  initialItems?: ItemComanda[]
  onChange?: (items: ItemComanda[]) => void
}

export function useComanda({ initialItems = [], onChange }: UseComandaOptions = {}) {
  const [items, setItems] = useState<ItemComanda[]>(initialItems)

  const addItem = useCallback((producto: { id: number; nombre: string; precio: number }) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === producto.id)
      if (idx >= 0) {
        const updated = [...prev]
        const nuevaCantidad = updated[idx].cantidad + 1
        updated[idx] = { ...updated[idx], cantidad: nuevaCantidad, subtotal: nuevaCantidad * updated[idx].precio }
        return updated
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          subtotal: producto.precio,
          notas: '',
        },
      ]
    })
  }, [])

  const removeItem = useCallback((id: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx < 0) return prev
      const item = prev[idx]
      if (item.cantidad <= 1) {
        return prev.filter((i) => i.id !== id)
      }
      const updated = [...prev]
      const nuevaCantidad = item.cantidad - 1
      updated[idx] = { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio }
      return updated
    })
  }, [])

  const increaseItem = useCallback((id: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx < 0) return prev
      const updated = [...prev]
      const nuevaCantidad = updated[idx].cantidad + 1
      updated[idx] = { ...updated[idx], cantidad: nuevaCantidad, subtotal: nuevaCantidad * updated[idx].precio }
      return updated
    })
  }, [])

  const decreaseItem = useCallback((id: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id)
      if (idx < 0) return prev
      const item = prev[idx]
      if (item.cantidad <= 1) {
        return prev.filter((i) => i.id !== id)
      }
      const updated = [...prev]
      const nuevaCantidad = item.cantidad - 1
      updated[idx] = { ...item, cantidad: nuevaCantidad, subtotal: nuevaCantidad * item.precio }
      return updated
    })
  }, [])

  const clearComanda = useCallback(() => {
    setItems([])
  }, [])

  const setItemNotas = useCallback((id: number, notas: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, notas } : i)))
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)

  return {
    items,
    setItems,
    addItem,
    removeItem,
    increaseItem,
    decreaseItem,
    clearComanda,
    setItemNotas,
    subtotal,
    itemCount: items.reduce((sum, i) => sum + i.cantidad, 0),
  }
}
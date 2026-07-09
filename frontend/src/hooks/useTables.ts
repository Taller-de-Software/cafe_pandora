import { useState, useEffect, useCallback } from 'react'
import type { Table, TableType } from '@/types/Table'

const STORAGE_KEY = 'cafe-pandora-tables'

function loadTables(): Table[] {
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

function saveTables(tables: Table[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables))
  } catch {
  }
}

export function useTables() {
  const [tables, setTables] = useState<Table[]>(loadTables)

  useEffect(() => {
    saveTables(tables)
  }, [tables])

  const addTable = useCallback((name: string, type: TableType) => {
    const table: Table = {
      id: crypto.randomUUID(),
      name,
      type,
      status: 'VACÍA',
    }
    setTables((prev) => [...prev, table])
  }, [])

  const reserveTable = useCallback((id: string, fecha: string, hora: string, nombreCliente?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'RESERVADA' as const, reservation: { fecha, hora, ...(nombreCliente ? { nombreCliente } : {}), estado: 'reservada' as const } }
          : t
      )
    )
  }, [])

  const updateReservation = useCallback((id: string, fecha: string, hora: string, nombreCliente?: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, reservation: { fecha, hora, ...(nombreCliente ? { nombreCliente } : {}), estado: 'reservada' as const } }
          : t
      )
    )
  }, [])

  const cancelReservation = useCallback((id: string) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'VACÍA' as const, reservation: undefined }
          : t
      )
    )
  }, [])

  const setTableStatus = useCallback((id: string, status: Table['status']) => {
    setTables((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status } : t
      )
    )
  }, [])

  return { tables, addTable, reserveTable, updateReservation, cancelReservation, setTableStatus }
}

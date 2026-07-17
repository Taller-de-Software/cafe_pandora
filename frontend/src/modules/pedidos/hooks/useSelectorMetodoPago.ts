import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listarMetodosPago } from '../data/facturas'
import type { MetodoPago } from '@/types/metodo-pago'

export function useSelectorMetodoPago() {
  const [metodoSeleccionId, setMetodoSeleccionId] = useState<number | null>(null)

  const { data: metodosPago = [], isPending: loading } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
    staleTime: 5 * 60 * 1000,
  })

  const metodoSeleccionado = metodosPago.find((m) => m.id === metodoSeleccionId) ?? null
  const esTransferencia = metodoSeleccionado?.nombre?.toUpperCase() === 'TRANSFERENCIA'

  return {
    metodosPago,
    loading,
    metodoSeleccionId,
    setMetodoSeleccionId,
    metodoSeleccionado,
    esTransferencia,
  }
}
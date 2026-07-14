import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listarMetodosPago } from '../data/facturas'
import type { MetodoPago } from '@/types/metodo-pago'

const TRANSFERENCIA_ENTIDADES = ['NEQUI', 'DAVIPLATA', 'NU'] as const

export function useSelectorMetodoPago() {
  const [metodoSeleccionId, setMetodoSeleccionId] = useState<number | null>(null)
  const [entidadTransferencia, setEntidadTransferencia] = useState<typeof TRANSFERENCIA_ENTIDADES[number]>('NEQUI')

  const { data: metodosPago = [], isPending: loading } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
    staleTime: 5 * 60 * 1000,
  })

  const metodoSeleccionado = metodosPago.find((m) => m.id === metodoSeleccionId) ?? null
  const esTransferencia = metodoSeleccionado?.entidad && TRANSFERENCIA_ENTIDADES.includes(metodoSeleccionado.entidad as typeof TRANSFERENCIA_ENTIDADES[number])

  return {
    metodosPago,
    loading,
    metodoSeleccionId,
    setMetodoSeleccionId,
    entidadTransferencia,
    setEntidadTransferencia,
    metodoSeleccionado,
    esTransferencia,
  }
}
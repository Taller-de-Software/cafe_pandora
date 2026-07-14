import { useMemo } from 'react'
import type { Pedido } from '../data/pedidos'

export function useCalculoFactura(pedido: Pedido, cobrarImpuesto: boolean, totalAbonado: number) {
  const totalPedido = useMemo(() => {
    return pedido.total ?? pedido.detalles.reduce((acc, d) => acc + d.precioUnitario * d.cantidad, 0)
  }, [pedido])

  const saldoPendiente = useMemo(() => Math.max(totalPedido - totalAbonado, 0), [totalPedido, totalAbonado])

  const subtotal = saldoPendiente

  const impuestoConsumo = useMemo(
    () => (cobrarImpuesto ? subtotal * 0.08 : 0),
    [cobrarImpuesto, subtotal]
  )

  const total = useMemo(() => subtotal + impuestoConsumo, [subtotal, impuestoConsumo])

  const calcularCambio = (recibido: number) => Math.max(0, recibido - total)

  return {
    totalPedido,
    totalAbonado,
    saldoPendiente,
    subtotal,
    impuestoConsumo,
    total,
    calcularCambio,
  }
}
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket, getSocket } from '@/services/socket'

export function usePedidosSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    connectSocket()
    const socket = getSocket()

    function onEstado() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-cocinando'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-listos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
    }

    function onNuevo() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
    }

    function onFusionado() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    }

    function onMesaActualizada() {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    }

    function onCajaApertura() {
      queryClient.invalidateQueries({ queryKey: ['caja'] })
    }

    function onCajaCierre() {
      queryClient.invalidateQueries({ queryKey: ['caja'] })
    }

    function onCajaRetiro() {
      queryClient.invalidateQueries({ queryKey: ['caja'] })
    }

    socket.on('pedido:estado', onEstado)
    socket.on('pedido:nuevo', onNuevo)
    socket.on('pedido:fusionado', onFusionado)
    socket.on('mesa:actualizada', onMesaActualizada)
    socket.on('caja:apertura', onCajaApertura)
    socket.on('caja:cierre', onCajaCierre)
    socket.on('caja:retiro', onCajaRetiro)

    return () => {
      socket.off('pedido:estado', onEstado)
      socket.off('pedido:nuevo', onNuevo)
      socket.off('pedido:fusionado', onFusionado)
      socket.off('mesa:actualizada', onMesaActualizada)
      socket.off('caja:apertura', onCajaApertura)
      socket.off('caja:cierre', onCajaCierre)
      socket.off('caja:retiro', onCajaRetiro)
    }
  }, [queryClient])
}

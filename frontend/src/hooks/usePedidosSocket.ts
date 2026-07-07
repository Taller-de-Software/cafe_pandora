import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectSocket, disconnectSocket, socket } from '@/services/socket'

export function usePedidosSocket() {
  const queryClient = useQueryClient()

  useEffect(() => {
    connectSocket()

    function onEstado(data: { pedidoId: number; estado: string }) {
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-hecho'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-finalizado'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-cocinando'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-listos'] })
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
    }

    function onNuevo() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['caja', 'activa'] })
    }

    function onFusionado() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-hecho'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-finalizado'] })
    }

    socket.on('pedido:estado', onEstado)
    socket.on('pedido:nuevo', onNuevo)
    socket.on('pedido:fusionado', onFusionado)

    return () => {
      socket.off('pedido:estado', onEstado)
      socket.off('pedido:nuevo', onNuevo)
      socket.off('pedido:fusionado', onFusionado)
      disconnectSocket()
    }
  }, [queryClient])
}

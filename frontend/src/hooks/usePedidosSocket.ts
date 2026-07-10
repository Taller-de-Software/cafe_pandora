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
      queryClient.invalidateQueries({ queryKey: ['inicio-recibido'] })
      queryClient.invalidateQueries({ queryKey: ['inicio-pendiente'] })
      queryClient.invalidateQueries({ queryKey: ['inicio-hecho'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
    }

    function onNuevo() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['inicio-recibido'] })
      queryClient.invalidateQueries({ queryKey: ['caja'] })
    }

    function onFusionado() {
      queryClient.invalidateQueries({ queryKey: ['pedidos-pendientes'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-hecho'] })
      queryClient.invalidateQueries({ queryKey: ['pedidos-por-pagar-finalizado'] })
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
    socket.on('caja:apertura', onCajaApertura)
    socket.on('caja:cierre', onCajaCierre)
    socket.on('caja:retiro', onCajaRetiro)

    return () => {
      socket.off('pedido:estado', onEstado)
      socket.off('pedido:nuevo', onNuevo)
      socket.off('pedido:fusionado', onFusionado)
      socket.off('caja:apertura', onCajaApertura)
      socket.off('caja:cierre', onCajaCierre)
      socket.off('caja:retiro', onCajaRetiro)
      disconnectSocket()
    }
  }, [queryClient])
}

import { useState, useEffect } from 'react'
import { getSocket } from '@/services/socket'

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface ConnectionState {
  status: ConnectionStatus
  attempt: number
}

export function useConnectionStatus(): ConnectionState {
  const [state, setState] = useState<ConnectionState>({
    status: 'disconnected',
    attempt: 0,
  })

  useEffect(() => {
    const socket = getSocket()

    function onConnect() {
      setState({ status: 'connected', attempt: 0 })
    }

    function onDisconnect() {
      setState((prev) => ({ ...prev, status: 'disconnected' }))
    }

    function onReconnectAttempt(attempt: number) {
      setState({ status: 'reconnecting', attempt })
    }

    function onReconnect() {
      setState({ status: 'connected', attempt: 0 })
    }

    function onReconnectFailed() {
      setState({ status: 'disconnected', attempt: 0 })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.io.on('reconnect_attempt', onReconnectAttempt)
    socket.io.on('reconnect', onReconnect)
    socket.io.on('reconnect_failed', onReconnectFailed)

    if (socket.connected) {
      setState({ status: 'connected', attempt: 0 })
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.io.off('reconnect_attempt', onReconnectAttempt)
      socket.io.off('reconnect', onReconnect)
      socket.io.off('reconnect_failed', onReconnectFailed)
    }
  }, [])

  return state
}

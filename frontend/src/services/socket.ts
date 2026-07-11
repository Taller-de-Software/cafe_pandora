import { io, type Socket } from 'socket.io-client'
import { storage } from './storage'
import { getSocketUrl } from './server-config'

let socketInstance: Socket | null = null

function createSocket(): Socket {
  const url = getSocketUrl()
  return io(url, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    auth: (cb: (auth: { token: string | null }) => void) => {
      cb({ token: storage.getAccessToken() })
    },
  })
}

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = createSocket()
  }
  return socketInstance
}

export function reconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
  socketInstance = createSocket()
}

export function connectSocket() {
  const token = storage.getAccessToken()
  if (!token) return
  const sock = getSocket()
  if (sock.connected) return
  sock.auth = { token }
  sock.connect()
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect()
  }
}

import { io } from 'socket.io-client'
import { storage } from './storage'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001'

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  auth: (cb) => {
    cb({ token: storage.getAccessToken() })
  },
})

export function connectSocket() {
  const token = storage.getAccessToken()
  if (!token) return
  if (socket.connected) return
  socket.auth = { token }
  socket.connect()
}

export function disconnectSocket() {
  socket.disconnect()
}

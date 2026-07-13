import { useContext, createContext } from 'react'
import type { Usuario, LoginRequest } from '../data/auth'

export interface AuthContextValue {
  user: Usuario | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: { nombre: string; pin?: string }) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  isFirstUser: boolean | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

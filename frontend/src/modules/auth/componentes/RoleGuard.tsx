import { Navigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import type { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: string
}

export function RoleGuard({ children, allowedRoles, fallback = '/dashboard/pedidos' }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || !allowedRoles.includes(user.rol)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}

import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@modules/auth/context/AuthContext'
import ProtectedRoute from '@modules/auth/componentes/ProtectedRoute'
import DashboardLayout from '@modules/dashboard/pages/dashboard'

export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  )
}

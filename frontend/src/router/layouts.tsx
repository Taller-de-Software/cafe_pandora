import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@modules/auth/context/AuthContext'
import { ProfileProvider } from '@modules/dashboard/context/ProfileContext'
import ProtectedRoute from '@modules/auth/componentes/ProtectedRoute'
import DashboardLayout from '@modules/dashboard/pages/dashboard'

export function RootLayout() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Outlet />
      </ProfileProvider>
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

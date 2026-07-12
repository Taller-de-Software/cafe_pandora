import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@modules/auth/context/AuthContext'
import { RoleProvider } from '@modules/auth/context/RoleContext'
import { ProfileProvider } from '@modules/dashboard/context/ProfileContext'
import ProtectedRoute from '@modules/auth/componentes/ProtectedRoute'
import DashboardLayout from '@modules/dashboard/pages/dashboard'

export function RootLayout() {
  return (
    <AuthProvider>
      <RoleProvider>
        <ProfileProvider>
          <Outlet />
        </ProfileProvider>
      </RoleProvider>
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

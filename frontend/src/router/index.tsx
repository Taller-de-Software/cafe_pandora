import { createBrowserRouter } from 'react-router-dom'
import { RootLayout, ProtectedLayout } from './layouts'
import Login from '@modules/login/pages/login'
import Inicio from '@modules/dashboard/pages/inicio'
import Menu from '@modules/menu/pages/menu'
import Pedidos from '@modules/pedidos/pages/pedidos'
import CajaFinanzas from '@modules/caja-finanzas/pages/caja-finanzas'
import { RoleGuard } from '@modules/auth/componentes/RoleGuard'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Login />,
      },
      {
        path: '/dashboard',
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <Inicio /> },
          { path: 'inicio', element: <Inicio /> },
          { path: 'menu', element: <RoleGuard allowedRoles={['administrador']}><Menu /></RoleGuard> },
          { path: 'pedidos', element: <Pedidos /> },
          { path: 'caja-finanzas', element: <RoleGuard allowedRoles={['administrador']}><CajaFinanzas /></RoleGuard> },
        ],
      },
    ],
  },
])

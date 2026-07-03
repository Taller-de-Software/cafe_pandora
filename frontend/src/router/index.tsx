import { createBrowserRouter } from 'react-router-dom'
import { RootLayout, ProtectedLayout } from './layouts'
import { NotFound, RouteError } from './error-components'
import Login from '@modules/login/pages/login'
import Inicio from '@modules/dashboard/pages/inicio'
import Menu from '@modules/menu/pages/menu'
import Pedidos from '@modules/pedidos/pages/pedidos'
import CajaFinanzas from '@modules/caja-finanzas/pages/caja-finanzas'
import Configuracion from '@modules/configuracion/pages/configuracion'
import { RoleGuard } from '@modules/auth/componentes/RoleGuard'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <Login />,
        errorElement: <RouteError />,
      },
      {
        path: '/dashboard',
        element: <ProtectedLayout />,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <Inicio />, errorElement: <RouteError /> },
          { path: 'inicio', element: <Inicio />, errorElement: <RouteError /> },
          { path: 'menu', element: <RoleGuard allowedRoles={['administrador']}><Menu /></RoleGuard>, errorElement: <RouteError /> },
          { path: 'pedidos', element: <Pedidos />, errorElement: <RouteError /> },
          { path: 'caja-finanzas', element: <CajaFinanzas />, errorElement: <RouteError /> },
          { path: 'configuracion', element: <RoleGuard allowedRoles={['administrador']}><Configuracion /></RoleGuard>, errorElement: <RouteError /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

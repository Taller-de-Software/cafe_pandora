import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from '@modules/login/pages/login'
import DashboardLayout from '@modules/dashboard/pages/dashboard'
import Menu from '@modules/menu/pages/menu'
import Pedidos from '@modules/pedidos/pages/pedidos'
import CajaFinanzas from '@modules/caja-finanzas/pages/caja-finanzas'
import Inicio from '@modules/inicio/pages/inicio'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/inicio" replace />,
      },
      {
        path: 'inicio',
        element: <Inicio />,
      },
      {
        path: 'menu',
        element: <Menu />,
      },
      {
        path: 'pedidos',
        element: <Pedidos />,
      },
      {
        path: 'caja-finanzas',
        element: <CajaFinanzas />,
      },
    ],
  },
])

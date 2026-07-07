import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BarraSuperior from '../componentes/barra-superior'
import SliderLateral from '../componentes/slider-lateral'
import { PedidosProvider } from '@modules/pedidos/context/PedidosContext'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="dashboard">
      <SliderLateral isOpen={sidebarOpen} />
      <div className="dashboard__body">
        <BarraSuperior onToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="dashboard__content">
          <PedidosProvider>
            <Outlet />
          </PedidosProvider>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

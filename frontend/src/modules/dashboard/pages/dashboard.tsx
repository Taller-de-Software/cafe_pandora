import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import BarraSuperior from '../componentes/barra-superior'
import SliderLateral from '../componentes/slider-lateral'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100">
      <SliderLateral isOpen={sidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <BarraSuperior onToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

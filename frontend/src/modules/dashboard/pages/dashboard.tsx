import { useState, useCallback, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BarraSuperior from '../componentes/barra-superior'
import SliderLateral from '../componentes/slider-lateral'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setSidebarOpen(false)
    }
  }, [location.pathname])

  return (
    <div className="dashboard">
      {sidebarOpen && window.innerWidth <= 1024 && (
        <div className="dashboard__backdrop" onClick={closeSidebar} />
      )}
      <SliderLateral isOpen={sidebarOpen} />
      <div className="dashboard__body">
        <BarraSuperior onToggle={toggleSidebar} />
        <main className="dashboard__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

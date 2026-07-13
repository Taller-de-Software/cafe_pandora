import { useState, useCallback, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import BarraSuperior from '../componentes/barra-superior'
import SliderLateral from '../componentes/slider-lateral'

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint)

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const isMobile = useIsMobile()

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [location.pathname, isMobile])

  return (
    <div className="dashboard">
      {sidebarOpen && isMobile && (
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

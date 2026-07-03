import { NavLink } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import Icono from './iconos'
import { itemsFijos, type ItemNavegacion } from '../data/navegacion'

function filtrarPorRol(items: ItemNavegacion[], rol?: string): ItemNavegacion[] {
  if (rol === 'mesero') {
    return items.filter(i => i.path === '/dashboard/inicio' || i.path === '/dashboard/pedidos' || i.path === '/dashboard/caja-finanzas')
  }
  return items
}

interface SliderLateralProps {
  isOpen: boolean
}

function SliderLateral({ isOpen }: SliderLateralProps) {
  const { user } = useAuth()
  const items = filtrarPorRol(itemsFijos, user?.rol)

  const sidebarClass = isOpen
    ? 'sidebar sidebar--expanded'
    : 'sidebar sidebar--collapsed'

  return (
    <aside className={`dashboard__sidebar ${sidebarClass}`}>
      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                }
              >
                <Icono name={item.icon} className="sidebar__icon" />
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default SliderLateral

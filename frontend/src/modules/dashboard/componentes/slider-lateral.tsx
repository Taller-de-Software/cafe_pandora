import { NavLink } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import { getApiUrl } from '@/services/server-config'
import Icono from './iconos'
import { itemsFijos, type ItemNavegacion } from '../data/navegacion'
import styles from './slider-lateral.module.css'

const BASE = getApiUrl().replace('/api', '')
const LOGO_URL = `${BASE}/uploads/productos/logo%20cafepandora.png`

const SUBTITLES: Record<string, string> = {
  '/dashboard/inicio': 'Panel principal',
  '/dashboard/menu': 'Platillos, Bebidas y Más',
  '/dashboard/pedidos': 'Toma de pedidos',
  '/dashboard/caja-finanzas': 'Contabilidad y Caja',
}

const ORDER = ['/dashboard/inicio', '/dashboard/pedidos', '/dashboard/menu', '/dashboard/caja-finanzas']

function filtrarPorRol(items: ItemNavegacion[], rol?: string): ItemNavegacion[] {
  const filtrados = rol === 'mesero'
    ? items.filter(i => i.path === '/dashboard/pedidos')
    : items
  return [...filtrados].sort((a, b) => ORDER.indexOf(a.path) - ORDER.indexOf(b.path))
}

interface SliderLateralProps {
  isOpen: boolean
}

function SliderLateral({ isOpen }: SliderLateralProps) {
  const { user } = useAuth()
  const items = filtrarPorRol(itemsFijos, user?.rol)

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.expanded : styles.collapsed}`}>
      <div className={styles.logoSection}>
        <img className={styles.logoCircle} src={LOGO_URL} alt="Café Pandora" />
        <h1 className={styles.systemName}>CAFÉ PANDORA</h1>
        <p className={styles.systemSub}>POS SISTEMA ADMINISTRATIVO</p>
      </div>

      <div className={styles.welcomeCard}>
        <p className={styles.welcomeText}>"Más que un lugar, una experiencia para tus sentidos."</p>
      </div>

      <div className={styles.navSection}>
        <p className={styles.navTitle}>
          CATEGORÍAS
          <span className={styles.navTitleBadge}>{items.length}</span>
        </p>
        <nav className={styles.navList}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navCard} ${isActive ? styles.navCardActive : ''}`
              }
            >
              <div className={styles.navIcon}>
                <Icono name={item.icon} className={styles.navSvg} />
              </div>
              <div className={styles.navText}>
                <span className={styles.navLabel}>{item.label.toUpperCase()}</span>
                <span className={styles.navSub}>{SUBTITLES[item.path] || ''}</span>
              </div>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default SliderLateral

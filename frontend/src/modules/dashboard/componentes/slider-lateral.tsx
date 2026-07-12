import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import { useProfile } from '../context/ProfileContext'
import Icono from './iconos'
import { itemsFijos, type ItemNavegacion } from '../data/navegacion'
import ProfileSettingsModal from './ProfileSettingsModal'
import styles from './slider-lateral.module.css'

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
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const items = filtrarPorRol(itemsFijos, user?.rol)
  const [showProfileModal, setShowProfileModal] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.expanded : styles.collapsed}`}>
      <div className={styles.logoSection}>
        <div className={styles.logoCircle} />
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

      <div className={styles.bottomSection}>
        <p className={styles.rolTitle}>ROL DE ACCESOS</p>
        <div className={styles.userCard} onClick={() => setShowProfileModal(true)}>
          <div className={styles.userAvatar}>
            {profile.nombre.charAt(0).toUpperCase() || (user?.rol ? user.rol.charAt(0).toUpperCase() : '?')}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{profile.nombre || (user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Usuario')}</span>
            <span className={styles.userRole}>{(user?.rol || '').toUpperCase()}</span>
          </div>
        </div>
        <ProfileSettingsModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <Icono name="salir" className={styles.logoutIcon} />
          CERRAR SESIÓN
        </button>
      </div>
    </aside>
  )
}

export default SliderLateral

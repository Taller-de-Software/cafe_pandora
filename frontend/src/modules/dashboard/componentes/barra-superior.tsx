import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import Icono from './iconos'
import styles from './barra-superior.module.css'

interface BarraSuperiorProps {
  onToggle: () => void
}

const STATUS_CONFIG = {
  connected: { color: 'var(--color-exito)', label: 'Backend: OK', dot: '🟢' },
  reconnecting: { color: 'var(--color-advertencia)', label: 'Reconectando...', dot: '🟡' },
  disconnected: { color: 'var(--color-peligro)', label: 'Sin conexión', dot: '🔴' },
} as const

function BarraSuperior({ onToggle }: BarraSuperiorProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { status, attempt } = useConnectionStatus()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  function handleConfig() {
    setMenuOpen(false)
    navigate('/dashboard/configuracion')
  }

  const initials = user?.nombre?.charAt(0)?.toUpperCase()
    || (user?.rol ? user.rol.charAt(0).toUpperCase() : '?')

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.toggle} onClick={onToggle} title="Toggle sidebar">
          <Icono name="hamburguesa" className={styles.icon} />
        </button>
        <div className={styles.brand}>
          <h1 className={styles.title}>CAFE PANDORA</h1>
          <p className={styles.subtitle}>BISTRO · CAFÉ BAR</p>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.connectionStatus} style={{ color: STATUS_CONFIG[status].color }}>
          <span className={styles.statusDot}>{STATUS_CONFIG[status].dot}</span>
          <span className={styles.statusLabel}>
            {status === 'reconnecting' ? `Intento ${attempt}` : STATUS_CONFIG[status].label}
          </span>
        </div>
        <div className={styles.profileWrapper} ref={menuRef}>
          <button className={styles.profileBtn} onClick={() => setMenuOpen(!menuOpen)}>
            <div className={styles.avatar}>{initials}</div>
          </button>
          {menuOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownName}>{user?.nombre || user?.rol || 'Usuario'}</span>
                <span className={styles.dropdownRole}>{(user?.rol || '').toUpperCase()}</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button className={styles.dropdownItem} onClick={handleConfig}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Configuración
              </button>
              <div className={styles.dropdownDivider} />
              <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                <Icono name="salir" className={styles.dropdownIcon} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default BarraSuperior

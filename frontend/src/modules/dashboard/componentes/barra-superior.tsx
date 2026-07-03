import { useNavigate } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import Icono from './iconos'
import styles from './barra-superior.module.css'

interface BarraSuperiorProps {
  onToggle: () => void
}

function BarraSuperior({ onToggle }: BarraSuperiorProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className={styles.topbar}>
      <button className={styles.toggle} onClick={onToggle} title="Toggle sidebar">
        <Icono name="hamburguesa" className={styles.icon} />
      </button>

      <h1 className={styles.title}>Café Pandora</h1>

      <div className={styles.actions}>
        <div className={styles.userInfo}>
          <div className={styles.userRole}>{user?.rol ?? ''}</div>
        </div>
        {user?.rol === 'administrador' && (
          <button className={styles.profileBtn} onClick={() => navigate('/dashboard/configuracion')} title="Configuración">
            <Icono name="usuario" className={styles.icon} />
          </button>
        )}
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <Icono name="salir" className={styles.icon} />
        </button>
      </div>
    </header>
  )
}

export default BarraSuperior

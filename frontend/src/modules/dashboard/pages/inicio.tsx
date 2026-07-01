import { Link } from 'react-router-dom'
import { useAuth } from '@modules/auth/context/useAuth'
import styles from './inicio.module.css'

const secciones = [
  { label: 'Menú', path: '/dashboard/menu', desc: 'Categorías, subcategorías y productos' },
  { label: 'Pedidos', path: '/dashboard/pedidos', desc: 'Gestión de pedidos y estados' },
  { label: 'Caja / Finanzas', path: '/dashboard/caja-finanzas', desc: 'Control de caja y retiros' },
]

function Inicio() {
  const { user } = useAuth()

  return (
    <div>
      <div className={styles.welcome}>
        <h2>Bienvenido, {user?.rol ?? 'Usuario'}</h2>
        <p>Selecciona una sección para comenzar</p>
      </div>

      <div className={styles.grid}>
        {(user?.rol === 'mesero' ? secciones.filter(s => s.path === '/dashboard/pedidos') : secciones).map((s) => (
          <Link key={s.path} to={s.path} className={styles.card}>
            <div className={styles.cardIcon}>{s.label[0]}</div>
            <div className={styles.cardContent}>
              <h3>{s.label}</h3>
              <p>{s.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Inicio

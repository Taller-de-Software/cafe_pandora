import type { CajaSesion } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './EstadoCaja.module.css'

interface EstadoCajaProps {
  sesion: CajaSesion | null
  onCierre: () => void
  onShowApertura: () => void
}

function EstadoCaja({ sesion, onCierre, onShowApertura }: EstadoCajaProps) {
  if (!sesion) {
    return (
      <div className={styles.openForm}>
        <p>No hay una sesión de caja activa</p>
        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onShowApertura}>
          Abrir Caja
        </button>
      </div>
    )
  }

  const abierta = !sesion.cierre

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Sesión de Caja</h3>
        <span className={`${styles.badge} ${abierta ? styles.activo : styles.cerrado}`}>
          {abierta ? 'Activa' : 'Cerrada'}
        </span>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Base Inicial</span>
          <span className={styles.statValue}>${formatearNumero(sesion.baseInicial)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Ventas</span>
          <span className={styles.statValue}>${formatearNumero(sesion.totalVentas)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Egresos</span>
          <span className={styles.statValue}>${formatearNumero(sesion.totalEgresos)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>En Caja</span>
          <span className={styles.statValue}>${formatearNumero(sesion.totalEnCaja)}</span>
        </div>
      </div>

      {abierta && (
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={onCierre}>
            Cerrar Caja
          </button>
        </div>
      )}
    </div>
  )
}

export default EstadoCaja

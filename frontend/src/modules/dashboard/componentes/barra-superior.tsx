import Icono from './iconos'
import styles from './barra-superior.module.css'

interface BarraSuperiorProps {
  onToggle: () => void
}

function BarraSuperior({ onToggle }: BarraSuperiorProps) {
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
      <div className={styles.right} />
    </header>
  )
}

export default BarraSuperior

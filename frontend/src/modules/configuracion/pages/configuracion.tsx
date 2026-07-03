import { useState } from 'react'
import Usuarios from '@modules/usuarios/pages/usuarios'
import MetodosPagoLista from '../componentes/MetodosPagoLista'
import styles from './configuracion.module.css'

type Tab = 'usuarios' | 'metodos-pago'

function Configuracion() {
  const [tab, setTab] = useState<Tab>('usuarios')

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Configuración</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'usuarios' ? styles.tabActive : ''}`}
          onClick={() => setTab('usuarios')}
        >
          Usuarios
        </button>
        <button
          className={`${styles.tab} ${tab === 'metodos-pago' ? styles.tabActive : ''}`}
          onClick={() => setTab('metodos-pago')}
        >
          Métodos de Pago
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'usuarios' && <Usuarios />}
        {tab === 'metodos-pago' && <MetodosPagoLista />}
      </div>
    </div>
  )
}

export default Configuracion

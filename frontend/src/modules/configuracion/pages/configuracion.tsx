import { useState } from 'react'
import Usuarios from '@modules/usuarios/pages/usuarios'
import MetodosPagoLista from '../componentes/MetodosPagoLista'
import ServidorSection from '../componentes/ServidorSection'
import NetworkDiagnosticsSection from '../componentes/NetworkDiagnosticsSection'
import PrintModeSection from '../componentes/PrintModeSection'
import styles from './configuracion.module.css'

type Tab = 'usuarios' | 'metodos-pago' | 'servidor' | 'red' | 'impresion'

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
        <button
          className={`${styles.tab} ${tab === 'servidor' ? styles.tabActive : ''}`}
          onClick={() => setTab('servidor')}
        >
          Servidor
        </button>
        <button
          className={`${styles.tab} ${tab === 'red' ? styles.tabActive : ''}`}
          onClick={() => setTab('red')}
        >
          Red
        </button>
        <button
          className={`${styles.tab} ${tab === 'impresion' ? styles.tabActive : ''}`}
          onClick={() => setTab('impresion')}
        >
          Impresión
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'usuarios' && <Usuarios />}
        {tab === 'metodos-pago' && <MetodosPagoLista />}
        {tab === 'servidor' && <ServidorSection />}
        {tab === 'red' && <NetworkDiagnosticsSection />}
        {tab === 'impresion' && <PrintModeSection />}
      </div>
    </div>
  )
}

export default Configuracion

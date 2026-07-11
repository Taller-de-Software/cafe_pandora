import { useState } from 'react'
import Usuarios from '@modules/usuarios/pages/usuarios'
import MetodosPagoLista from '../componentes/MetodosPagoLista'
import ServerConfigModal from '../componentes/ServerConfigModal'
import PrintModeSection from '../componentes/PrintModeSection'
import styles from './configuracion.module.css'

type Tab = 'usuarios' | 'metodos-pago' | 'servidor' | 'impresion'

function Configuracion() {
  const [tab, setTab] = useState<Tab>('usuarios')
  const [showServerModal, setShowServerModal] = useState(false)

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
          className={`${styles.tab} ${tab === 'impresion' ? styles.tabActive : ''}`}
          onClick={() => setTab('impresion')}
        >
          Impresión
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'usuarios' && <Usuarios />}
        {tab === 'metodos-pago' && <MetodosPagoLista />}
        {tab === 'servidor' && (
          <div className={styles.serverSection}>
            <p className={styles.serverHint}>
              Configura la dirección del backend. En PC usa <strong>localhost</strong>. En tablet o móvil usa la IP del computador donde corre el servidor.
            </p>
            <button className={styles.serverBtn} onClick={() => setShowServerModal(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              Configurar Conexión del Servidor
            </button>
          </div>
        )}
        {tab === 'impresion' && <PrintModeSection />}
      </div>

      {showServerModal && (
        <ServerConfigModal onClose={() => setShowServerModal(false)} />
      )}
    </div>
  )
}

export default Configuracion

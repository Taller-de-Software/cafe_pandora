import { createPortal } from 'react-dom'
import styles from './ConfirmModal.module.css'

interface ConfirmModalProps {
  titulo: string
  mensaje: string
  textoConfirmar?: string
  textoCancelar?: string
  onConfirmar: () => void
  onCancelar: () => void
  variante?: 'danger' | 'default'
}

function ConfirmModal({
  titulo,
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  variante = 'default',
}: ConfirmModalProps) {
  return createPortal(
    <div className={styles.overlay} onClick={onCancelar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.titulo}>{titulo}</h3>
        <p className={styles.mensaje}>{mensaje}</p>
        <div className={styles.actions}>
          <button className={styles.btnCancelar} onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button
            className={`${styles.btnConfirmar} ${variante === 'danger' ? styles.btnDanger : ''}`}
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal

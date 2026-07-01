import { classificarError, type ErrorInfo } from '@/utils/errores'
import styles from './ErrorModal.module.css'

interface ErrorModalProps {
  error: unknown
  onClose: () => void
}

const iconos: Record<string, string> = {
  connection: '\u26A0',
  auth: '\uD83D\uDD12',
  validation: '\u26A0',
  server: '\u274C',
  unknown: '!',
}

function ErrorModal({ error, onClose }: ErrorModalProps) {
  const info: ErrorInfo = error && typeof error === 'object' && 'type' in error && 'title' in error && 'message' in error
    ? (error as ErrorInfo)
    : classificarError(error)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.icon} ${styles[info.type] || styles.unknown}`}>
          {iconos[info.type] || iconos.unknown}
        </div>
        <h3 className={styles.title}>{info.title}</h3>
        <p className={styles.message}>{info.message}</p>
        <button className={styles.btn} onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  )
}

export default ErrorModal

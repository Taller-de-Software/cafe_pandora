import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toast.module.css'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
  duration?: number
}

const icons: Record<ToastType, string> = {
  success: '\u2714',
  info: '\u2139',
  warning: '\u26A0',
  error: '\u2718',
}

interface ToastProps {
  toast: ToastItem
  onDismiss: (id: number) => void
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3500)
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onDismiss(toast.id), 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, toast.type, onDismiss])

  return (
    <div
      className={`${styles.toast} ${styles[toast.type]} ${exiting ? styles.exiting : ''}`}
      onClick={() => {
        setExiting(true)
        setTimeout(() => onDismiss(toast.id), 300)
      }}
    >
      <span className={styles.icon}>{icons[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return createPortal(
    <div className={styles.container}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  )
}

export { ToastContainer }
export default Toast

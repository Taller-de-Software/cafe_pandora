import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import ErrorModal from '@/componentes/ErrorModal'
import { ToastContainer, type ToastItem, type ToastType } from '@/componentes/Toast'

interface ErrorContextValue {
  showError: (error: unknown) => void
  showSuccess: (message: string) => void
  showInfo: (message: string) => void
  showWarning: (message: string) => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<unknown>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counterRef = useRef(0)

  const showError = useCallback((err: unknown) => {
    console.error('[ErrorContext]', err)
    setError(err)
  }, [])

  const addToast = useCallback((type: ToastType, message: string, duration?: number) => {
    counterRef.current += 1
    const id = counterRef.current
    setToasts((prev) => [...prev, { id, type, message, duration }])
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showSuccess = useCallback((message: string) => {
    addToast('success', message)
  }, [addToast])

  const showInfo = useCallback((message: string) => {
    addToast('info', message)
  }, [addToast])

  const showWarning = useCallback((message: string) => {
    addToast('warning', message)
  }, [addToast])

  return (
    <ErrorContext.Provider value={{ showError, showSuccess, showInfo, showWarning }}>
      {children}
      {error && createPortal(
        <ErrorModal error={error} onClose={() => setError(null)} />,
        document.body
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ErrorContext.Provider>
  )
}

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) throw new Error('useError debe usarse dentro de ErrorProvider')
  return ctx
}

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import ErrorModal from '@/componentes/ErrorModal'

interface ErrorContextValue {
  showError: (error: unknown) => void
}

const ErrorContext = createContext<ErrorContextValue | null>(null)

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<unknown>(null)

  const showError = useCallback((err: unknown) => {
    console.error('[ErrorContext]', err)
    setError(err)
  }, [])

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {error && <ErrorModal error={error} onClose={() => setError(null)} />}
    </ErrorContext.Provider>
  )
}

export function useError(): ErrorContextValue {
  const ctx = useContext(ErrorContext)
  if (!ctx) throw new Error('useError debe usarse dentro de ErrorProvider')
  return ctx
}

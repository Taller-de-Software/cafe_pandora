import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorProvider } from './context/ErrorContext'
import { ErrorBoundary } from './utils/ErrorBoundary'
import { router } from './router'
import './index.css'

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Promesa rechazada no manejada:', event.reason)
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ErrorProvider>
          <RouterProvider router={router} />
        </ErrorProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)

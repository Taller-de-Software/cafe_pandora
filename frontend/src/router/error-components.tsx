import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 700, color: '#b45309', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0.5rem 0 2rem' }}>
        Página no encontrada
      </p>
      <Link
        to="/"
        style={{
          padding: '0.5rem 1.5rem',
          background: '#b45309',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}

export function RouteError() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <h1 style={{ fontSize: '1.5rem', color: '#991b1b', margin: 0 }}>Error en la página</h1>
      <p style={{ color: '#6b7280', margin: '0.5rem 0 2rem' }}>
        Ocurrió un error al cargar esta sección.
      </p>
      <Link
        to="/"
        style={{
          padding: '0.5rem 1.5rem',
          background: '#b45309',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        Volver al inicio
      </Link>
    </div>
  )
}

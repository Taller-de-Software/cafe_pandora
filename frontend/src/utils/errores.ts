export type ErrorType = 'connection' | 'auth' | 'validation' | 'server' | 'unknown'

export interface ErrorInfo {
  type: ErrorType
  title: string
  message: string
}

export function classificarError(error: unknown): ErrorInfo {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'connection',
      title: 'Error de conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
    }
  }

  const msg = error instanceof Error ? error.message : String(error)

  if (/sesión expirada|token inválido|no autorizado|credenciales incorrectas/i.test(msg)) {
    return {
      type: 'auth',
      title: 'Error de autenticación',
      message: msg,
    }
  }

  if (/^\d{3}/.test(msg)) {
    const code = parseInt(msg, 10)
    if (code >= 400 && code < 500) {
      return {
        type: 'validation',
        title: 'Error de validación',
        message: msg.replace(/^\d{3}\s*/, ''),
      }
    }
    if (code >= 500) {
      return {
        type: 'server',
        title: 'Error del servidor',
        message: 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
      }
    }
  }

  if (/error al iniciar sesión|contraseña|pin inválido/i.test(msg)) {
    return {
      type: 'auth',
      title: 'Credenciales incorrectas',
      message: msg,
    }
  }

  return {
    type: 'unknown',
    title: 'Error inesperado',
    message: msg || 'Ocurrió un error inesperado.',
  }
}

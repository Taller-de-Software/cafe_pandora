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

  if (/^(?:401|403)\s/.test(msg)) {
    return {
      type: 'auth',
      title: 'Error de autenticación',
      message: msg.replace(/^\d{3}\s*/, ''),
    }
  }

  if (/^404\s/.test(msg)) {
    return {
      type: 'validation',
      title: 'No encontrado',
      message: msg.replace(/^\d{3}\s*/, ''),
    }
  }

  if (/^4\d{2}\s/.test(msg)) {
    return {
      type: 'validation',
      title: 'Error de validación',
      message: msg.replace(/^\d{3}\s*/, ''),
    }
  }

  if (/^5\d{2}\s/.test(msg)) {
    return {
      type: 'server',
      title: 'Error del servidor',
      message: msg.replace(/^\d{3}\s*/, '') || 'Ocurrió un error en el servidor. Intenta de nuevo más tarde.',
    }
  }

  if (/sesión expirada|token inválido|no autorizado|credenciales incorrectas|pin inválido/i.test(msg)) {
    return {
      type: 'auth',
      title: 'Error de autenticación',
      message: msg,
    }
  }

  if (/La solicitud tardó demasiado/.test(msg)) {
    return {
      type: 'connection',
      title: 'Tiempo de espera agotado',
      message: 'El servidor no respondió a tiempo. Verifica tu conexión e intenta de nuevo.',
    }
  }

  return {
    type: 'unknown',
    title: 'Error inesperado',
    message: msg || 'Ocurrió un error inesperado.',
  }
}

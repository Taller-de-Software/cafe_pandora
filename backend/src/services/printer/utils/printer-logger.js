const LOG_PREFIX = '[PRINTER]';

function formatMessage(level, message, connectionType) {
  const ts = new Date().toISOString().slice(11, 19);
  const ct = connectionType ? `[${connectionType.toUpperCase()}]` : '';
  return `${LOG_PREFIX} ${ts} ${level} ${ct} ${message}`;
}

export const printerLogger = {
  info(message, connectionType) {
    console.log(formatMessage('INFO', message, connectionType));
  },

  warn(message, connectionType) {
    console.warn(formatMessage('WARN', message, connectionType));
  },

  error(message, error, connectionType) {
    const detail = error?.message ? ` — ${error.message}` : '';
    console.error(formatMessage('ERROR', `${message}${detail}`, connectionType));
  },

  debug(message, connectionType) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PRINTER) {
      console.log(formatMessage('DEBUG', message, connectionType));
    }
  },

  connection(action, device, connectionType) {
    const icons = { connecting: '🔌', connected: '✅', disconnecting: '🔌', disconnected: '⭕', failed: '❌' };
    const msgs = {
      connecting: `Conectando a ${device}...`,
      connected: `Conectado — ${device}`,
      disconnecting: `Desconectando ${device}...`,
      disconnected: `Desconectado — ${device}`,
      failed: `Error al conectar — ${device}`,
    };
    console.log(formatMessage('INFO', `${icons[action]} ${msgs[action]}`, connectionType));
  },

  print(action, device, connectionType) {
    const icons = { sending: '📤', sent: '✅', failed: '❌' };
    const msgs = {
      sending: `Enviando a ${device}...`,
      sent: `Impresión completada — ${device}`,
      failed: `Error de impresión — ${device}`,
    };
    console.log(formatMessage('INFO', `${icons[action]} ${msgs[action]}`, connectionType));
  },
};

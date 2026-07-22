/** @type {import('../printer.types.js').PrinterError|null} */
let lastError = null;

export function setLastError(error) {
  lastError = { ...error };
}

export function getLastError() {
  return lastError;
}

export function clearLastError() {
  lastError = null;
}

/**
 * Construye un objeto PrinterError estructurado a partir de un error genérico.
 */
export function buildPrinterError(error, extra = {}) {
  const raw = error?.message || 'Error desconocido';

  const base = {
    code: 'ERROR_DESCONOCIDO',
    message: raw,
    detail: raw,
    connectionType: extra.connectionType || null,
    device: extra.device || null,
    port: extra.port || null,
    suggestion: 'Revise los logs del servidor para más detalle.',
    timestamp: new Date().toISOString(),
  };

  if (raw.includes('Cannot find USB device') || raw.includes('No se encontró')) {
    base.code = 'USB_NO_ENCONTRADO';
    base.message = `Impresora USB no encontrada${extra.device ? ` (${extra.device})` : ''}.`;
    base.suggestion = 'Verifique que la impresora esté encendida y el cable USB conectado.';
  } else if (error?.code === 'EACCES' || raw.includes('Access denied')) {
    base.code = 'PERMISO_DENEGADO';
    base.message = `Permiso denegado al dispositivo${extra.port ? ` ${extra.port}` : ''}.`;
    base.suggestion = 'En Linux, revise las reglas udev o los permisos del usuario.';
  } else if (error?.code === 'ENODEV' || raw.includes('no such device')) {
    base.code = 'DISPOSITIVO_NO_DISPONIBLE';
    base.message = `Dispositivo no disponible${extra.port ? ` ${extra.port}` : ''}.`;
    base.suggestion = 'Reconecte el dispositivo físicamente y reintente.';
  } else if (error?.code === 'EBUSY') {
    base.code = 'PUERTO_OCUPADO';
    base.message = `El puerto${extra.port ? ` ${extra.port}` : ''} está en uso.`;
    base.suggestion = 'Cierre otras aplicaciones que usen la impresora.';
  } else if (error?.code === 'ENOENT') {
    base.code = 'PUERTO_NO_EXISTE';
    base.message = `El puerto${extra.port ? ` ${extra.port}` : ''} no existe.`;
    base.suggestion = 'Verifique el nombre del puerto en Configuración.';
  } else if (error?.code === 'ETIMEOUT' || error?.code === 'ETIMEDOUT') {
    base.code = 'TIMEOUT_CONEXION';
    base.message = 'Tiempo de espera agotado al conectar.';
    base.suggestion = 'Verifique que la impresora esté encendida y accesible.';
  } else if (error?.code === 'ECONNREFUSED') {
    base.code = 'TCP_RECHAZADO';
    base.message = `Conexión rechazada en ${extra.port || 'la dirección configurada'}.`;
    base.suggestion = 'Confirme la IP y el puerto, y que la impresora esté en red.';
  } else if (raw.includes('usbprint')) {
    base.code = 'DRIVER_NATIVO';
    base.message = 'Windows usa usbprint.sys que bloquea libusb.';
    base.suggestion = 'Use Windows Print Spooler en modo RAW, o instale WinUSB con Zadig.';
  }

  setLastError(base);
  return base;
}

export function getErrorMessage(error, connectionType) {
  const details = buildPrinterError(error, { connectionType });
  return `[${connectionType || 'IMPRESORA'}] ${details.message}`;
}

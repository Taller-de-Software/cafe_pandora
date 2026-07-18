import type { EstadoMesa } from '../data/pos'

export interface EstadoMesaMapa {
  label: string
  className: string
}

export const ESTADO_MESA_MAPA: Record<EstadoMesa, EstadoMesaMapa> = {
  vacia: { label: 'VACÍA', className: 'estado-vacia' },
  ocupada: { label: 'OCUPADA', className: 'estado-ocupada' },
  por_pagar: { label: 'POR PAGAR', className: 'estado-por-pagar' },
  reservada: { label: 'RESERVADA', className: 'estado-reservada' },
  fuera_de_servicio: { label: 'FUERA DE SERVICIO', className: 'estado-fuera-servicio' },
}

export function getEstadoMesaLabel(estado: EstadoMesa): string {
  return ESTADO_MESA_MAPA[estado]?.label ?? estado.toUpperCase()
}

export function getEstadoMesaClass(estado: EstadoMesa): string {
  return ESTADO_MESA_MAPA[estado]?.className ?? 'estado-vacia'
}

export const MINUTOS_AVISO_RESERVA = 20

export function isReservaProxima(reserva: { fecha: string; hora: string }): boolean {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const colombiaDateStr = `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}-${parts.find(p => p.type === 'day')!.value}`

  const fechaStr = reserva.fecha.split('T')[0]
  const [year, month, day] = fechaStr.split('-').map(Number)
  const [hours, minutes] = reserva.hora.split(':').map(Number)
  const reservaTimestamp = Date.UTC(year, month - 1, day, hours + 5, minutes, 0)

  const diffMs = reservaTimestamp - Date.now()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 0) return false
  if (fechaStr !== colombiaDateStr) return false

  return diffMin <= MINUTOS_AVISO_RESERVA
}

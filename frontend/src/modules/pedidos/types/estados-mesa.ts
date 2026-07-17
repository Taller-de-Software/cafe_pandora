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

export const MINUTOS_BLOQUEO_RESERVA = 20
export const MINUTOS_HABILITACION_RESERVA = 10

export type EstadoReservaTiming = 'normal' | 'bloqueada' | 'habilitada'

export function getEstadoReservaTiming(
  reserva: { fecha: string; hora: string }
): EstadoReservaTiming | null {
  const nowUtc = Date.now()
  const COLOMBIA_OFFSET_MS = -5 * 3600_000

  const colombiaNow = new Date(nowUtc + COLOMBIA_OFFSET_MS)
  const colombiaDateStr = colombiaNow.toISOString().split('T')[0]

  const [year, month, day] = reserva.fecha.split('-').map(Number)
  const [hours, minutes] = reserva.hora.split(':').map(Number)
  const reservaTimestamp = Date.UTC(year, month - 1, day, hours + 5, minutes, 0)

  const diffMs = reservaTimestamp - nowUtc
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 0) return null
  if (reserva.fecha !== colombiaDateStr) return null

  if (diffMin <= MINUTOS_HABILITACION_RESERVA) return 'habilitada'
  if (diffMin <= MINUTOS_BLOQUEO_RESERVA) return 'bloqueada'
  return 'normal'
}
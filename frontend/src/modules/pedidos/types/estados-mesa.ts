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
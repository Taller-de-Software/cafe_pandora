export function formatearNumero(valor: number): string {
  return Math.round(valor).toLocaleString('es-CL')
}

export function formatearHora(hora?: string | null): string {
  if (!hora) return '—'
  const [hh, mm] = hora.split(':').map(Number)
  if (isNaN(hh) || isNaN(mm)) return hora
  const ampm = hh >= 12 ? 'p.m.' : 'a.m.'
  const h12 = hh % 12 || 12
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`
}

export function formatearFecha(fecha?: string | null): string {
  if (!fecha) return '—'
  const partes = fecha.split('-')
  if (partes.length !== 3) return fecha
  const [y, m, d] = partes
  return `${d}/${m}/${y}`
}

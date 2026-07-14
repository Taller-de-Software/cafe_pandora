export function obtenerColumnaDestinoEnUso(asignaciones: Record<string, number>): number | null {
  const columnasUsadas = new Set(Object.values(asignaciones).filter((c) => c !== 1))
  if (columnasUsadas.size === 0) return null
  if (columnasUsadas.size === 1) return [...columnasUsadas][0]
  return null
}
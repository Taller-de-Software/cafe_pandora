export function formatearNumero(valor: number): string {
  return Math.round(valor).toLocaleString('es-CL')
}

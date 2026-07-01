export interface Categoria {
  id: number
  nombre: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/menu/categorias`)
  if (!res.ok) throw new Error('Error al cargar categorías')
  return res.json()
}

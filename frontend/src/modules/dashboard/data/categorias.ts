import type { ItemNavegacion, IconoNombre } from './navegacion'
import { BASE_URL } from '@/services/api'

export interface Categoria {
  id: number
  nombre: string
}

export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await fetch(`${API_URL}/menu/categorias`)
  if (!res.ok) throw new Error('Error al cargar categorías')
  return res.json()
}

export function mapCategoriasToItems(categorias: Categoria[]): ItemNavegacion[] {
  return categorias.map((cat) => ({
    label: cat.nombre,
    path: `/dashboard/${cat.nombre.toLowerCase().replace(/\s+/g, '-')}`,
    icon: 'menu' as IconoNombre,
  }))
}

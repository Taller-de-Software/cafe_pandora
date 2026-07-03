import { api } from '@/services/api'

export interface Subcategoria {
  id: number
  nombre: string
  categoriaId: number
  categoria?: { id: number; nombre: string }
}

export async function listarSubcategorias(categoriaId?: number): Promise<Subcategoria[]> {
  const query = categoriaId ? `?categoriaId=${categoriaId}` : ''
  return api.get<Subcategoria[]>(`/menu/subcategorias${query}`)
}

export async function crearSubcategoria(data: {
  nombre: string
  categoriaId: number
}): Promise<Subcategoria> {
  return api.post<Subcategoria>('/menu/subcategorias', data)
}

export async function actualizarSubcategoria(
  id: number,
  data: { nombre?: string; categoriaId?: number }
): Promise<Subcategoria> {
  return api.put<Subcategoria>(`/menu/subcategorias/${id}`, data)
}

export async function eliminarSubcategoria(id: number): Promise<void> {
  return api.delete(`/menu/subcategorias/${id}`)
}

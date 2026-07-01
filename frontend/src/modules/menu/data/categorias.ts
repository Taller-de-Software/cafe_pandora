import { api } from '@/services/api'

export interface Categoria {
  id: number
  nombre: string
  _count?: { productos: number; subcategorias: number }
}

export async function listarCategorias(): Promise<Categoria[]> {
  return api.get<Categoria[]>('/menu/categorias')
}

export async function crearCategoria(data: { nombre: string }): Promise<Categoria> {
  return api.post<Categoria>('/menu/categorias', data)
}

export async function eliminarCategoria(id: number): Promise<void> {
  return api.delete(`/menu/categorias/${id}`)
}

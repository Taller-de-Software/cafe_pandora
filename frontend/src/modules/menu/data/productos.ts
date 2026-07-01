import { api } from '@/services/api'

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  imagenUrl?: string
  requierePreparacion: boolean
  categoriaId: number
  subcategoriaId?: number
  categoria?: { id: number; nombre: string }
  subcategoria?: { id: number; nombre: string } | null
}

export async function listarProductos(categoriaId?: number): Promise<Producto[]> {
  const query = categoriaId ? `?categoriaId=${categoriaId}` : ''
  return api.get<Producto[]>(`/menu/productos${query}`)
}

export async function crearProducto(data: {
  nombre: string
  precio: number
  categoriaId: number
  descripcion?: string
  requierePreparacion?: boolean
  subcategoriaId?: number
}): Promise<Producto> {
  return api.post<Producto>('/menu/productos', data)
}

export async function eliminarProducto(id: number): Promise<void> {
  return api.delete(`/menu/productos/${id}`)
}

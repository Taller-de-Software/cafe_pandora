import { api } from '@/services/api'

export interface Producto {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  imagenUrl?: string
  requierePreparacion: boolean
  habilitado: boolean
  categoriaId: number
  subcategoriaId?: number
  categoria?: { id: number; nombre: string }
  subcategoria?: { id: number; nombre: string } | null
}

export async function listarProductos(params?: {
  categoriaId?: number
  subcategoriaId?: number
}): Promise<Producto[]> {
  const query = new URLSearchParams()
  if (params?.categoriaId) query.set('categoriaId', String(params.categoriaId))
  if (params?.subcategoriaId) query.set('subcategoriaId', String(params.subcategoriaId))
  const qs = query.toString()
  return api.get<Producto[]>(`/menu/productos${qs ? `?${qs}` : ''}`)
}

export async function obtenerProducto(id: number): Promise<Producto> {
  return api.get<Producto>(`/menu/productos/${id}`)
}

export async function crearProducto(formData: FormData): Promise<Producto> {
  return api.postFormData<Producto>('/menu/productos', formData)
}

export async function actualizarProducto(id: number, formData: FormData): Promise<Producto> {
  return api.putFormData<Producto>(`/menu/productos/${id}`, formData)
}

export async function eliminarProducto(id: number): Promise<void> {
  return api.delete(`/menu/productos/${id}`)
}

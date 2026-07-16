import { api } from '@/services/api'

export interface Usuario {
  id: number
  nombre: string
  rol: string
}

export interface ActualizarUsuarioRequest {
  nombre?: string
  rol?: 'administrador' | 'mesero'
  pin?: string
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios')
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  return api.get<Usuario>(`/usuarios/${id}`)
}

export async function actualizarUsuario(id: number, data: ActualizarUsuarioRequest): Promise<Usuario> {
  return api.put<Usuario>(`/usuarios/${id}`, data)
}

export async function eliminarUsuario(id: number): Promise<void> {
  return api.delete(`/usuarios/${id}`)
}

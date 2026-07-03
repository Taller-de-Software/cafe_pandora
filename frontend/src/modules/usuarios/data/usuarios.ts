import { api } from '@/services/api'

export interface Usuario {
  id: number
  rol: string
}

export interface CrearUsuarioRequest {
  rol: 'administrador' | 'mesero'
  pin?: string
}

export interface ActualizarUsuarioRequest {
  pin?: string
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return api.get<Usuario[]>('/usuarios')
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  return api.get<Usuario>(`/usuarios/${id}`)
}

export async function crearUsuario(data: CrearUsuarioRequest): Promise<Usuario> {
  return api.post<Usuario>('/usuarios', data)
}

export async function actualizarUsuario(id: number, data: ActualizarUsuarioRequest): Promise<Usuario> {
  return api.put<Usuario>(`/usuarios/${id}`, data)
}

export async function eliminarUsuario(id: number): Promise<void> {
  return api.delete(`/usuarios/${id}`)
}

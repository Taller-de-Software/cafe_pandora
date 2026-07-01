import { api } from '@/services/api'

export interface LoginRequest {
  rol: 'administrador' | 'mesero'
  pin?: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  usuario: Usuario
}

export interface Usuario {
  id: number
  rol: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return api.post('/auth/login', data)
}

export async function getMe(): Promise<Usuario> {
  return api.get<Usuario>('/auth/me')
}

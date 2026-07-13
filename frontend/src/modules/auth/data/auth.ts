import { api } from '@/services/api'

export interface LoginRequest {
  nombre: string
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
  nombre: string
  rol: string
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return api.post('/auth/login', data)
}

export async function getMe(): Promise<Usuario> {
  return api.get<Usuario>('/auth/me')
}

export interface RegisterResponse {
  accessToken: string
  refreshToken: string
  usuario: Usuario
  esPrimero: boolean
}

export async function register(data: { nombre: string; pin?: string }): Promise<RegisterResponse> {
  return api.post<RegisterResponse>('/auth/register', data)
}

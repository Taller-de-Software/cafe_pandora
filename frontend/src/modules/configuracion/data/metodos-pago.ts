import { api } from '@/services/api'
import type { MetodoPago } from '@/types/metodo-pago'

export async function listarMetodosPago(): Promise<MetodoPago[]> {
  return api.get<MetodoPago[]>('/metodos-pago')
}

export async function crearMetodoPago(data: { nombre: string; entidad?: string }): Promise<MetodoPago> {
  return api.post<MetodoPago>('/metodos-pago', data)
}

export async function actualizarMetodoPago(id: number, data: { nombre?: string; entidad?: string }): Promise<MetodoPago> {
  return api.put<MetodoPago>(`/metodos-pago/${id}`, data)
}

export async function eliminarMetodoPago(id: number): Promise<void> {
  return api.delete(`/metodos-pago/${id}`)
}
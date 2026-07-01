export type IconoNombre = 'menu' | 'pedidos' | 'caja' | 'hamburguesa' | 'usuario' | 'salir' | 'home'

export interface ItemNavegacion {
  label: string
  path: string
  icon: IconoNombre
}

export const itemsFijos: ItemNavegacion[] = [
  { label: 'Inicio', path: '/dashboard/inicio', icon: 'home' },
  { label: 'Menú', path: '/dashboard/menu', icon: 'menu' },
  { label: 'Pedidos', path: '/dashboard/pedidos', icon: 'pedidos' },
  { label: 'Caja / Finanzas', path: '/dashboard/caja-finanzas', icon: 'caja' },
]

import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { Categoria } from '@/services/categorias'
import { fetchCategorias } from '@/services/categorias'

interface SliderLateralProps {
  isOpen: boolean
}

const itemsFijos = [
  { label: 'Menú', path: '/dashboard/menu' },
  { label: 'Pedidos', path: '/dashboard/pedidos' },
  { label: 'Caja / Finanzas', path: '/dashboard/caja-finanzas' },
]

function SliderLateral({ isOpen }: SliderLateralProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchCategorias()
      .then(setCategorias)
      .catch(() => setError(true))
  }, [])

  return (
    <aside
      className={`bg-amber-900 text-white flex flex-col transition-all duration-300 overflow-hidden ${
        isOpen ? 'w-56' : 'w-0'
      }`}
    >
      <nav className="flex-1 pt-4">
        {error || categorias.length === 0 ? (
          <ul className="space-y-1 px-2">
            {itemsFijos.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-amber-700 text-white font-semibold'
                        : 'text-amber-100 hover:bg-amber-800 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-1 px-2">
            {categorias.map((cat) => (
              <li key={cat.id}>
                <NavLink
                  to={`/dashboard/${cat.nombre.toLowerCase().replace(/\s+/g, '-')}`}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-amber-700 text-white font-semibold'
                        : 'text-amber-100 hover:bg-amber-800 hover:text-white'
                    }`
                  }
                >
                  {cat.nombre}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  )
}

export default SliderLateral

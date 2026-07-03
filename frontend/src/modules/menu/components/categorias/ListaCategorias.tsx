import type { Categoria } from '../data/categorias'
import TarjetaCategoria from './TarjetaCategoria'
import styles from './ListaCategorias.module.css'

interface ListaCategoriasProps {
  categorias: Categoria[]
  categoriaActivaId: number | null
  onSeleccionar: (id: number | null) => void
  onAbrirFormulario: () => void
}

function ListaCategorias({
  categorias,
  categoriaActivaId,
  onSeleccionar,
  onAbrirFormulario,
}: ListaCategoriasProps) {
  return (
    <div className={styles.contenedor}>
      <button className={styles.btnEditar} onClick={onAbrirFormulario} title="Editar categorías">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14.5 2.5a1.5 1.5 0 00-2.12-2.12L6 6.5 5.5 9.5 8.5 9l6-6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={styles.scroll}>
        <TarjetaCategoria
          categoria={{ id: 0, nombre: 'Todas' }}
          activa={categoriaActivaId === null}
          onSeleccionar={() => onSeleccionar(null)}
        />
        {categorias.length === 0 && (
          <span className={styles.vacio}>Sin categorías</span>
        )}
        {categorias.map((cat) => (
          <TarjetaCategoria
            key={cat.id}
            categoria={cat}
            activa={cat.id === categoriaActivaId}
            onSeleccionar={() => onSeleccionar(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ListaCategorias

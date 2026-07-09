import type { Categoria } from '../../api/categorias'
import TarjetaCategoria from './TarjetaCategoria'
import styles from './ListaCategorias.module.css'

interface ListaCategoriasProps {
  categorias: Categoria[]
  categoriaActivaId: number | null
  onSeleccionar: (id: number | null) => void
}

function ListaCategorias({
  categorias,
  categoriaActivaId,
  onSeleccionar,
}: ListaCategoriasProps) {
  return (
    <div className={styles.contenedor}>
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

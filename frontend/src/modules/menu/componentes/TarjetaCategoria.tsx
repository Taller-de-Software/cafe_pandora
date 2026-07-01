import type { Categoria } from '../data/categorias'
import styles from './TarjetaCategoria.module.css'

interface TarjetaCategoriaProps {
  categoria: Categoria
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}

function TarjetaCategoria({ categoria, selected, onSelect, onDelete }: TarjetaCategoriaProps) {
  return (
    <div
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.info}>
        <h3>{categoria.nombre}</h3>
        <span>{categoria._count?.productos ?? 0} productos</span>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete() }}
      >
        Eliminar
      </button>
    </div>
  )
}

export default TarjetaCategoria

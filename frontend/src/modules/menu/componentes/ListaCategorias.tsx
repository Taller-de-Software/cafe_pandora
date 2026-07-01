import type { Categoria } from '../data/categorias'
import TarjetaCategoria from './TarjetaCategoria'
import styles from './ListaCategorias.module.css'

interface ListaCategoriasProps {
  categorias: Categoria[]
  selectedId: number | null
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  onAdd: () => void
}

function ListaCategorias({ categorias, selectedId, onSelect, onDelete, onAdd }: ListaCategoriasProps) {
  return (
    <div>
      <div className={styles.header}>
        <h3>Categorías</h3>
        <button className={styles.addBtn} onClick={onAdd}>+ Nueva</button>
      </div>
      <div className={styles.list}>
        {categorias.length === 0 && (
          <p className={styles.empty}>Sin categorías</p>
        )}
        {categorias.map((cat) => (
          <TarjetaCategoria
            key={cat.id}
            categoria={cat}
            selected={cat.id === selectedId}
            onSelect={() => onSelect(cat.id)}
            onDelete={() => onDelete(cat.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ListaCategorias

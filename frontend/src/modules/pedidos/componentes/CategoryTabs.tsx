import styles from './CategoryTabs.module.css'

interface CategoryTabsProps {
  categorias: { id: number; nombre: string }[]
  activa: number | null
  onSelect: (id: number | null) => void
}

function CategoryTabs({ categorias, activa, onSelect }: CategoryTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activa === null ? styles.active : ''}`}
        onClick={() => onSelect(null)}
      >
        Todos
      </button>
      {categorias.map((c) => (
        <button
          key={c.id}
          className={`${styles.tab} ${activa === c.id ? styles.active : ''}`}
          onClick={() => onSelect(c.id)}
        >
          {c.nombre}
        </button>
      ))}
    </div>
  )
}

export default CategoryTabs

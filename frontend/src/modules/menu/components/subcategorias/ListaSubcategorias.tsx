import type { Subcategoria } from '../data/subcategorias'
import TarjetaSubcategoria from './TarjetaSubcategoria'
import styles from './ListaSubcategorias.module.css'

interface ListaSubcategoriasProps {
  subcategorias: Subcategoria[]
  subcategoriaActivaId: number | null
  onSeleccionar: (id: number | null) => void
  onAbrirFormulario: () => void
}

function ListaSubcategorias({
  subcategorias,
  subcategoriaActivaId,
  onSeleccionar,
  onAbrirFormulario,
}: ListaSubcategoriasProps) {
  return (
    <div className={styles.contenedor}>
      <button className={styles.btnEditar} onClick={onAbrirFormulario} title="Editar subcategorías">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14.5 2.5a1.5 1.5 0 00-2.12-2.12L6 6.5 5.5 9.5 8.5 9l6-6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </button>
      <div className={styles.scroll}>
        {subcategorias.length === 0 && (
          <span className={styles.vacio}>Sin subcategorías</span>
        )}
        <TarjetaSubcategoria
          subcategoria={{ id: 0, nombre: 'Todas', categoriaId: 0 }}
          activa={subcategoriaActivaId === null}
          onSeleccionar={() => onSeleccionar(null)}
        />
        {subcategorias.map((sub) => (
          <TarjetaSubcategoria
            key={sub.id}
            subcategoria={sub}
            activa={sub.id === subcategoriaActivaId}
            onSeleccionar={() => onSeleccionar(sub.id)}
          />
        ))}
      </div>
    </div>
  )
}

export default ListaSubcategorias

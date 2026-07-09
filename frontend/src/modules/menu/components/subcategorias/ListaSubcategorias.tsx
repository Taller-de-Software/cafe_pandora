import type { Subcategoria } from '../../api/subcategorias'
import TarjetaSubcategoria from './TarjetaSubcategoria'
import styles from './ListaSubcategorias.module.css'

interface ListaSubcategoriasProps {
  subcategorias: Subcategoria[]
  subcategoriaActivaId: number | null
  onSeleccionar: (id: number | null) => void
}

function ListaSubcategorias({
  subcategorias,
  subcategoriaActivaId,
  onSeleccionar,
}: ListaSubcategoriasProps) {
  return (
    <div className={styles.contenedor}>
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

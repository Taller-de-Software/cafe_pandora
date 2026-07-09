import type { Subcategoria } from '../../api/subcategorias'
import styles from './TarjetaSubcategoria.module.css'

interface TarjetaSubcategoriaProps {
  subcategoria: Subcategoria
  activa: boolean
  onSeleccionar: () => void
}

function TarjetaSubcategoria({ subcategoria, activa, onSeleccionar }: TarjetaSubcategoriaProps) {
  return (
    <button
      className={`${styles.pill} ${activa ? styles.pillActiva : ''}`}
      onClick={onSeleccionar}
    >
      {subcategoria.nombre}
    </button>
  )
}

export default TarjetaSubcategoria

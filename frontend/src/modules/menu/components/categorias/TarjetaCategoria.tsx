import type { Categoria } from '../../api/categorias'
import styles from './TarjetaCategoria.module.css'

interface TarjetaCategoriaProps {
  categoria: Categoria
  activa: boolean
  onSeleccionar: () => void
}

function TarjetaCategoria({ categoria, activa, onSeleccionar }: TarjetaCategoriaProps) {
  return (
    <button
      className={`${styles.pill} ${activa ? styles.pillActiva : ''}`}
      onClick={onSeleccionar}
    >
      {categoria.nombre}
    </button>
  )
}

export default TarjetaCategoria

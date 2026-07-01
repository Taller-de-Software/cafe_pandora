import type { Producto } from '../data/productos'
import { formatearNumero } from '@/utils/formatear'
import styles from './ListaProductos.module.css'

interface ListaProductosProps {
  productos: Producto[]
  categoriaNombre: string | null
  onAdd: () => void
}

function ListaProductos({ productos, categoriaNombre, onAdd }: ListaProductosProps) {
  if (!categoriaNombre) {
    return <p className={styles.noCategory}>Selecciona una categoría para ver sus productos</p>
  }

  return (
    <div>
      <div className={styles.header}>
        <h3>{categoriaNombre}</h3>
        <button className={styles.addBtn} onClick={onAdd}>+ Nuevo</button>
      </div>
      <div className={styles.list}>
        {productos.length === 0 && (
          <p className={styles.empty}>Sin productos en esta categoría</p>
        )}
        {productos.map((p) => (
          <div key={p.id} className={styles.card}>
            <h4>{p.nombre}</h4>
            {p.descripcion && <p>{p.descripcion}</p>}
            <div className={styles.precio}>${formatearNumero(p.precio)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ListaProductos

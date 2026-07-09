import type { Producto } from '../../api/productos'
import TarjetaProducto from './TarjetaProducto'
import styles from './ListaProductos.module.css'

interface ListaProductosProps {
  productos: Producto[]
  categoriaNombre: string | null
  onGestionar: () => void
  onEditar: (producto: Producto) => void
  onEliminar: (id: number) => void
}

function ListaProductos({
  productos,
  categoriaNombre,
  onGestionar,
  onEditar,
  onEliminar,
}: ListaProductosProps) {
  if (!categoriaNombre) {
    return <p className={styles.noCategory}>Selecciona una categoría para ver sus productos</p>
  }

  return (
    <div className={styles.contenedor}>
      <div className={styles.gestionBar}>
        <div className={styles.header}>
          <h3 className={styles.titulo}>GESTIÓN DE CARTA</h3>
          <span className={styles.contador}>{productos.length} producto(s)</span>
          <button className={styles.btnAgregar} onClick={onGestionar}>
            Gestionar Menú
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        {productos.length === 0 && (
          <p className={styles.vacio}>Sin productos en esta categoría</p>
        )}
        {productos.map((p) => (
          <TarjetaProducto
            key={p.id}
            producto={p}
            onEditar={onEditar}
            onEliminar={onEliminar}
          />
        ))}
      </div>
    </div>
  )
}

export default ListaProductos

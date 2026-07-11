import type { Producto } from '../../api/productos'
import TarjetaProducto from './TarjetaProducto'
import EncabezadoGrupo from './EncabezadoGrupo'
import styles from './ListaProductos.module.css'

interface GrupoProductos {
  subcategoriaId: number | null
  nombre: string
  productos: Producto[]
}

interface ListaProductosProps {
  productos: Producto[]
  grupos?: GrupoProductos[] | null
  categoriaNombre: string | null
  onGestionar: () => void
  onEditar: (producto: Producto) => void
  onEliminar: (id: number) => void
}

function renderTarjetas(productos: Producto[], onEditar: (p: Producto) => void, onEliminar: (id: number) => void) {
  return productos.map((p) => (
    <TarjetaProducto
      key={p.id}
      producto={p}
      onEditar={onEditar}
      onEliminar={onEliminar}
    />
  ))
}

function ListaProductos({
  productos,
  grupos,
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
        {grupos ? (
          <div className={styles.grupos}>
            {grupos.map((grupo) => (
              <div key={grupo.subcategoriaId ?? '__otros__'} className={styles.grupoSection}>
                <EncabezadoGrupo nombre={grupo.nombre} total={grupo.productos.length} />
                <div className={styles.grid}>
                  {renderTarjetas(grupo.productos, onEditar, onEliminar)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {productos.length === 0 && (
              <p className={styles.vacio}>Sin productos en esta categoría</p>
            )}
            {renderTarjetas(productos, onEditar, onEliminar)}
          </div>
        )}
      </div>
    </div>
  )
}

export default ListaProductos

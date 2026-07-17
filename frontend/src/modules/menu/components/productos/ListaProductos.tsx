import { useState, memo, useMemo } from 'react'
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
  busqueda: string
  onBusquedaChange: (value: string) => void
  onGestionar: () => void
  onEditar: (producto: Producto) => void
  onEliminar: (id: number) => void
}

const ListaProductos = memo(function ListaProductos({
  productos,
  grupos,
  categoriaNombre,
  busqueda,
  onBusquedaChange,
  onGestionar,
  onEditar,
  onEliminar,
}: ListaProductosProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  const tarjetas = useMemo(
    () => productos.map((p) => (
      <TarjetaProducto key={p.id} producto={p} onEditar={onEditar} onEliminar={onEliminar} />
    )),
    [productos, onEditar, onEliminar]
  )

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

        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={`${styles.searchInput} ${searchFocused ? styles.searchInputFocused : ''}`}
            type="text"
            placeholder="Buscar por nombre, descripción o categoría..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {busqueda && (
            <button className={styles.searchClear} onClick={() => onBusquedaChange('')}>
              ✕
            </button>
          )}
        </div>

        {grupos ? (
          <div className={styles.grupos}>
            {grupos.map((grupo) => (
              <div key={grupo.subcategoriaId ?? '__otros__'} className={styles.grupoSection}>
                <EncabezadoGrupo nombre={grupo.nombre} total={grupo.productos.length} />
                <div className={styles.grid}>
                  {grupo.productos.map((p) => (
                    <TarjetaProducto key={p.id} producto={p} onEditar={onEditar} onEliminar={onEliminar} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {productos.length === 0 && (
              <p className={styles.vacio}>Sin productos en esta categoría</p>
            )}
            {tarjetas}
          </div>
        )}
      </div>
    </div>
  )
})

export default ListaProductos

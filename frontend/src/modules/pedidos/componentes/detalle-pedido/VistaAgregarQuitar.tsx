import styles from './VistaAgregarQuitar.module.css'
import type { Subcategoria } from '@/modules/menu/api/subcategorias'
import type { Producto } from '@/modules/menu/api/productos'
import type { ProductoRow } from '@/modules/pedidos/types/tipos-comanda'

interface VistaAgregarQuitarProps {
  categorias: { id: number; nombre: string }[]
  catalogoFiltrado: Producto[]
  draftItems: ProductoRow[]
  categoriaActiva: number | null
  subcategoriaActiva: number | null
  subcategorias: Subcategoria[]
  busqueda: string
  onCategoriaChange: (id: number | null) => void
  onSubcategoriaChange: (id: number | null) => void
  onBusquedaChange: (value: string) => void
  onAgregarProducto: (producto: Producto) => void
  onQuitarProducto: (nombre: string) => void
  onVolver: () => void
  hasChanges: boolean
  isPending: boolean
  onConfirmar: () => void
}

export default function VistaAgregarQuitar({
  categorias,
  catalogoFiltrado,
  draftItems,
  categoriaActiva,
  subcategoriaActiva,
  subcategorias,
  busqueda,
  onCategoriaChange,
  onSubcategoriaChange,
  onBusquedaChange,
  onAgregarProducto,
  onQuitarProducto,
  onVolver,
  hasChanges,
  isPending,
  onConfirmar,
}: VistaAgregarQuitarProps) {
  return (
    <>
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>AGREGAR/QUITAR PRODUCTOS</span>
          <button className={styles.editVolverBtn} onClick={onVolver}>VOLVER</button>
        </div>

        <div className={styles.editFilters}>
          <button
            className={`${styles.filterPill} ${categoriaActiva === null ? styles.filterPillActive : ''}`}
            onClick={() => onCategoriaChange(null)}
          >
            TODOS
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.filterPill} ${categoriaActiva === cat.id ? styles.filterPillActive : ''}`}
              onClick={() => onCategoriaChange(categoriaActiva === cat.id ? null : cat.id)}
            >
              {cat.nombre.toUpperCase()}
            </button>
          ))}
          <input
            className={styles.editSearchInput}
            type="text"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
          />
        </div>

        {categoriaActiva !== null && subcategorias.length > 0 && (
          <div className={styles.subcategoriasRow}>
            {subcategorias.map((sub) => (
              <button
                key={sub.id}
                className={`${styles.filterPill} ${subcategoriaActiva === sub.id ? styles.filterPillActive : ''}`}
                onClick={() => onSubcategoriaChange(subcategoriaActiva === sub.id ? null : sub.id)}
              >
                {sub.nombre.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        <div className={styles.catalogoList}>
          {catalogoFiltrado.length > 0 ? (
            catalogoFiltrado.map((producto) => (
              <div key={producto.id} className={styles.catalogoItem}>
                <div className={styles.catalogoItemInfo}>
                  <span className={styles.catalogoItemName}>{producto.nombre}</span>
                  <span className={styles.catalogoItemPrice}>${producto.precio.toLocaleString('es-CO')}</span>
                </div>
                <button className={styles.btnAdd} onClick={() => onAgregarProducto(producto)}>+</button>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>No se encontraron productos</p>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      <h3 className={styles.currentItemsTitle}>PRODUCTOS ACTUALES DEL PEDIDO</h3>

      <div className={styles.currentItemsList}>
        {draftItems.length === 0 ? (
          <p className={styles.emptyText}>No hay productos en el pedido</p>
        ) : (
          draftItems.map((item, i) => (
            <div key={i} className={styles.currentItem}>
              <div className={styles.currentItemInfo}>
                <span className={styles.currentItemName}>{item.nombre}</span>
                <span className={styles.currentItemQty}>x{item.cantidad}</span>
              </div>
              <button className={styles.btnRemove} onClick={() => onQuitarProducto(item.nombre)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className={styles.footerLeft}>
        <button className={styles.btnVolverFooter} onClick={onVolver}>VOLVER</button>
      </div>
      <button className={styles.btnConfirmar} disabled={!hasChanges || isPending} onClick={onConfirmar}>
        {isPending ? 'Guardando...' : 'CONFIRMAR CAMBIOS'}
      </button>
    </>
  )
}
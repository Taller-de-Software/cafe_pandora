import { useState, useEffect } from 'react'
import type { Table } from '@/types/Table'
import type { Categoria } from '../../menu/api/categorias'
import type { Producto } from '../../menu/api/productos'
import { listarCategorias } from '../../menu/api/categorias'
import { listarProductos } from '../../menu/api/productos'
import { formatearNumero } from '@/utils/formatear'
<<<<<<< HEAD
import { useAuth } from '@modules/auth/context/useAuth'
=======
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
import TarjetaProductoPedido from './TarjetaProductoPedido'
import styles from './TomaPedidoView.module.css'

interface ItemComanda {
  id: number
  nombre: string
  precio: number
  cantidad: number
}

interface TomaPedidoViewProps {
  table: Table
  onBack: () => void
<<<<<<< HEAD
  onConfirmarPedido: (mesa: string, mesaNumero: number, items: { nombre: string; cantidad: number; precioUnitario: number }[], mesero: string) => void
}

function TomaPedidoView({ table, onBack, onConfirmarPedido }: TomaPedidoViewProps) {
  const { user } = useAuth()
=======
  onConfirmarPedido: (mesa: string, items: { nombre: string; cantidad: number }[]) => void
}

function TomaPedidoView({ table, onBack, onConfirmarPedido }: TomaPedidoViewProps) {
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [comanda, setComanda] = useState<ItemComanda[]>([])
  const [showVaciarConfirm, setShowVaciarConfirm] = useState(false)

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    listarProductos(categoriaActivaId ? { categoriaId: categoriaActivaId } : undefined)
      .then(setProductos)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [categoriaActivaId])

  useEffect(() => {
    if (!showVaciarConfirm) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancelarVaciar()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showVaciarConfirm])

  const productosFiltrados = busqueda
    ? productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : productos

  const subtotal = comanda.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  function agregarProducto(producto: Producto) {
    setComanda((prev) => {
      const existente = prev.find((i) => i.id === producto.id)
      if (existente) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }]
    })
  }

  function aumentarCantidad(id: number) {
    setComanda((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i))
    )
  }

  function disminuirCantidad(id: number) {
    setComanda((prev) => {
      const item = prev.find((i) => i.id === id)
      if (item && item.cantidad <= 1) {
        return prev.filter((i) => i.id !== id)
      }
      return prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i))
    })
  }

  function eliminarProducto(id: number) {
    setComanda((prev) => prev.filter((i) => i.id !== id))
  }

  function vaciarComanda() {
    setShowVaciarConfirm(true)
  }

  function confirmarVaciar() {
    setComanda([])
    setShowVaciarConfirm(false)
  }

  function cancelarVaciar() {
    setShowVaciarConfirm(false)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.leftColumn}>
          <div className={styles.header}>
            <span className={styles.headerLabel}>CATEGORÍA PEDIDOS</span>
            <div className={styles.headerRow}>
              <span className={styles.headerTitle}>
                MESA {table.name} ({table.type}) • CATÁLOGO DE PRODUCTOS
              </span>
              <button className={styles.backLink} onClick={onBack}>
                ← Cambiar Mesa
              </button>
            </div>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.categoriesRow}>
              <button
                className={`${styles.categoryPill} ${categoriaActivaId === null ? styles.categoryPillActive : ''}`}
                onClick={() => setCategoriaActivaId(null)}
              >
                Todos
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryPill} ${categoriaActivaId === cat.id ? styles.categoryPillActive : ''}`}
                  onClick={() => setCategoriaActivaId(cat.id)}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className={styles.catalogScroll}>
            <div className={styles.productGrid}>
              {loading ? (
                <p className={styles.emptyProducts}>Cargando productos...</p>
              ) : productosFiltrados.length === 0 ? (
                <p className={styles.emptyProducts}>No se encontraron productos</p>
              ) : (
                productosFiltrados.map((p) => (
                  <TarjetaProductoPedido key={p.id} producto={p} onClick={() => agregarProducto(p)} />
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>RESUMEN DE MESA {table.name} ({table.type})</h3>
            <div className={styles.summaryDivider} />

            {comanda.length === 0 ? (
              <div className={styles.summaryBody}>
                <svg className={styles.cartIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                <p className={styles.emptyCart}>Comanda vacía</p>
                <p className={styles.emptyCartHint}>Toque los productos de la izquierda para agregarlos a la comanda.</p>
              </div>
            ) : (
              <div className={styles.comandaScroll}>
                {comanda.map((item) => (
                  <div key={item.id} className={styles.comandaItem}>
                    <div className={styles.comandaItemRow}>
                      <span className={styles.comandaName}>{item.nombre}</span>
                      <button className={styles.deleteBtn} onClick={() => eliminarProducto(item.id)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className={styles.comandaItemRow}>
                      <span className={styles.comandaUnitPrice}>${formatearNumero(item.precio)} c/u</span>
                      <span className={styles.comandaLineTotal}>${formatearNumero(item.precio * item.cantidad)}</span>
                    </div>
                    <div className={styles.comandaControls}>
                      <button className={styles.qtyBtn} onClick={() => disminuirCantidad(item.id)}>−</button>
                      <span className={styles.qtyValue}>{item.cantidad}</span>
                      <button className={styles.qtyBtn} onClick={() => aumentarCantidad(item.id)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>${formatearNumero(subtotal)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>TOTAL PEDIDO:</span>
              <span>${formatearNumero(subtotal)}</span>
            </div>
            <div className={styles.actionsRow}>
              <button className={styles.vaciarBtn} disabled={comanda.length === 0} onClick={vaciarComanda}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button className={styles.confirmBtn} disabled={comanda.length === 0} onClick={() => {
<<<<<<< HEAD
                onConfirmarPedido(
                  `Mesa ${table.name} (${table.type})`,
                  Number(table.name),
                  comanda.map((item) => ({ nombre: item.nombre, cantidad: item.cantidad, precioUnitario: item.precio })),
                  user?.rol ?? 'mesero'
                )
=======
                onConfirmarPedido(`Mesa ${table.name} (${table.type})`, comanda.map((item) => ({ nombre: item.nombre, cantidad: item.cantidad })))
>>>>>>> 851c78be1872df1fd6718c45d83774748d0663a5
                onBack()
              }}>
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
      {showVaciarConfirm && (
        <div className={styles.confirmOverlay} onClick={cancelarVaciar}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Vaciar comanda?</h3>
            <p className={styles.confirmText}>
              Se eliminarán todos los productos agregados a este pedido. Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={cancelarVaciar}>Cancelar</button>
              <button className={styles.confirmDelete} onClick={confirmarVaciar}>Sí, vaciar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TomaPedidoView

import { useState, useEffect, useMemo } from 'react'
import type { PedidoPendiente, ItemPedidoPendiente } from '@/types/PedidoPendiente'
import type { Categoria } from '../../menu/api/categorias'
import type { Producto } from '../../menu/api/productos'
import { listarCategorias } from '../../menu/api/categorias'
import { listarProductos } from '../../menu/api/productos'
import { formatearNumero } from '@/utils/formatear'
import styles from './DetallePedidoModal.module.css'

interface DetallePedidoModalProps {
  open: boolean
  pedido: PedidoPendiente | null
  onClose: () => void
  onActualizarPedido: (id: string, items: ItemPedidoPendiente[]) => void
}

function DetallePedidoModal({ open, pedido, onClose, onActualizarPedido }: DetallePedidoModalProps) {
  const [editando, setEditando] = useState(false)
  const [productosEditados, setProductosEditados] = useState<ItemPedidoPendiente[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {})
    listarProductos().then(setProductos).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) {
      setEditando(false)
      setProductosEditados([])
      setCategoriaFiltro(null)
      setBusqueda('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const tieneCambios = useMemo(() => {
    if (!pedido) return false
    const original = pedido.items
    if (productosEditados.length !== original.length) return true
    return productosEditados.some((item, i) =>
      item.cantidad !== original[i].cantidad ||
      item.nombre !== original[i].nombre ||
      item.precioUnitario !== original[i].precioUnitario
    )
  }, [productosEditados, pedido])

  const productosFiltradosCatalogo = useMemo(() => {
    let filtered = productos
    if (categoriaFiltro !== null) {
      filtered = filtered.filter((p) => p.categoriaId === categoriaFiltro)
    }
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      filtered = filtered.filter((p) => p.nombre.toLowerCase().includes(q))
    }
    return filtered.filter((p) => p.habilitado !== false)
  }, [productos, categoriaFiltro, busqueda])

  if (!open || !pedido) return null

  function entrarEdicion() {
    if (!pedido) return
    setProductosEditados(pedido.items.map((i) => ({ ...i })))
    setEditando(true)
  }

  function salirEdicion() {
    setEditando(false)
    setCategoriaFiltro(null)
    setBusqueda('')
  }

  function agregarProductoEdicion(p: Producto) {
    setProductosEditados((prev) => {
      const existente = prev.find((i) => i.nombre === p.nombre)
      if (existente) {
        return prev.map((i) =>
          i.nombre === p.nombre ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { nombre: p.nombre, cantidad: 1, precioUnitario: p.precio }]
    })
  }

  function quitarProductoEdicion(index: number) {
    setProductosEditados((prev) => {
      const item = prev[index]
      if (item.cantidad <= 1) {
        return prev.filter((_, i) => i !== index)
      }
      return prev.map((i, idx) =>
        idx === index ? { ...i, cantidad: i.cantidad - 1 } : i
      )
    })
  }

  function confirmarCambios() {
    if (!pedido || !tieneCambios) return
    onActualizarPedido(pedido.id, productosEditados)
    salirEdicion()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* ─── Header ─── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaCircle}>{pedido.mesaNumero}</div>
            <div>
              <h2 className={styles.headerTitle}>MESA {pedido.mesaNumero} • DETALLES</h2>
              <p className={styles.headerSub}>Comanda #{pedido.id}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ─── Cuerpo ─── */}
        <div className={styles.body}>

          {/* Info row */}
          <div className={styles.infoRow}>
            <div className={styles.infoCol}>
              <span className={styles.infoLabel}>HORA COMANDA</span>
              <span className={styles.infoValue}>{pedido.horaCreacion}</span>
            </div>
            <div className={styles.infoCol}>
              <span className={styles.infoLabel}>MESERO ATIENDE</span>
              <span className={styles.infoValue}>{pedido.mesero}</span>
            </div>
          </div>

          {/* Productos solicitados (originales) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitleOrange}>PRODUCTOS SOLICITADOS</h3>
            <div className={styles.productosScroll}>
              {pedido.items.map((item, i) => {
                const subtotal = item.precioUnitario * item.cantidad
                return (
                  <div key={i}>
                    <div className={styles.productoRow}>
                      <div className={styles.productoInfo}>
                        <span className={styles.productoNombre}>{item.nombre.toUpperCase()}</span>
                        <span className={styles.productoDetalle}>
                          ${formatearNumero(item.precioUnitario)} c/u × {item.cantidad}
                        </span>
                      </div>
                      <span className={styles.productoSubtotal}>${formatearNumero(subtotal)}</span>
                    </div>
                    {i < pedido.items.length - 1 && <div className={styles.divider} />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Acciones / Edicion */}
          {editando ? (
            <div className={styles.editPanel}>

              {/* Panel header */}
              <div className={styles.editPanelHeader}>
                <span className={styles.editPanelTitle}>AGREGAR/QUITAR PRODUCTOS</span>
                <button className={styles.editVolverBtn} onClick={salirEdicion}>VOLVER</button>
              </div>

              {/* Filters */}
              <div className={styles.editFilters}>
                <div className={styles.filterPills}>
                  <button
                    className={`${styles.filterPill} ${categoriaFiltro === null ? styles.filterPillActive : ''}`}
                    onClick={() => setCategoriaFiltro(null)}
                  >
                    TODOS
                  </button>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      className={`${styles.filterPill} ${categoriaFiltro === cat.id ? styles.filterPillActive : ''}`}
                      onClick={() => setCategoriaFiltro(cat.id)}
                    >
                      {cat.nombre.toUpperCase()}
                    </button>
                  ))}
                </div>
                <input
                  className={styles.editSearchInput}
                  type="text"
                  placeholder="Buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              {/* Catalog list */}
              <div className={styles.catalogoScroll}>
                {productosFiltradosCatalogo.length === 0 ? (
                  <p className={styles.emptyText}>No se encontraron productos</p>
                ) : (
                  productosFiltradosCatalogo.map((p) => (
                    <div key={p.id} className={styles.catalogoItem}>
                      <div className={styles.catalogoInfo}>
                        <span className={styles.catalogoNombre}>{p.nombre.toUpperCase()}</span>
                        <span className={styles.catalogoPrecio}>${formatearNumero(p.precio)}</span>
                      </div>
                      <button className={styles.btnAdd} onClick={() => agregarProductoEdicion(p)}>+</button>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.divider} />

              {/* Current products (edited) */}
              <span className={styles.editSectionTitle}>PRODUCTOS ACTUALES DEL PEDIDO</span>
              <div className={styles.actualesScroll}>
                {productosEditados.length === 0 ? (
                  <p className={styles.emptyText}>No hay productos en el pedido</p>
                ) : (
                  productosEditados.map((item, i) => (
                    <div key={i} className={styles.actualItem}>
                      <span className={styles.actualNombre}>{item.nombre.toUpperCase()}</span>
                      <div className={styles.actualControls}>
                        <span className={styles.actualCant}>x{item.cantidad}</span>
                        <button className={styles.btnRemove} onClick={() => quitarProductoEdicion(i)}>−</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className={styles.section}>
              <h3 className={styles.sectionTitleGray}>ACCIONES DEL PEDIDO</h3>
              <div className={styles.accionesGrid}>
                <button className={styles.accionCard} onClick={entrarEdicion}>
                  <div className={styles.accionIconBox}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={styles.accionTitle}>AGREGAR/QUITAR PRODUCTOS</span>
                  <span className={styles.accionDesc}>Añade o quita items desde el catálogo al pedido actual.</span>
                </button>

                <button className={styles.accionCard} onClick={() => console.log('Acción: Separar Cuentas')}>
                  <div className={styles.accionIconBox}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-3-3m3 3l-3 3m-1 7H4m0 0l3 3m-3-3l3-3" />
                    </svg>
                  </div>
                  <span className={styles.accionTitle}>SEPARAR CUENTAS</span>
                  <span className={styles.accionDesc}>Divide el cobro en montos distintos entre comensales.</span>
                </button>

                <button className={styles.accionCard} onClick={() => console.log('Acción: Unir Mesas')}>
                  <div className={styles.accionIconBox}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <span className={styles.accionTitle}>UNIR MESAS</span>
                  <span className={styles.accionDesc}>Fusiona el pedido de otra mesa en un solo recibo.</span>
                </button>

                <button className={styles.accionCard} onClick={() => console.log('Acción: Cambiar Mesa')}>
                  <div className={styles.accionIconBox}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className={styles.accionTitle}>CAMBIAR MESA</span>
                  <span className={styles.accionDesc}>Reasigna el pedido a una mesa disponible.</span>
                </button>

                <button className={styles.accionCard} onClick={() => console.log('Acción: Abonar Dinero')}>
                  <div className={styles.accionIconBox}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={styles.accionTitle}>ABONAR DINERO</span>
                  <span className={styles.accionDesc}>Resta un monto abonado de la cuenta total de la mesa.</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        {editando ? (
          <div className={styles.footer}>
            <button className={styles.footerBtnSecondary} onClick={salirEdicion}>VOLVER</button>
            <button className={styles.footerBtnPrimary} disabled={!tieneCambios} onClick={confirmarCambios}>
              CONFIRMAR CAMBIOS
            </button>
          </div>
        ) : (
          <div className={styles.footer}>
            <button className={styles.btnCerrar} onClick={onClose}>CERRAR DETALLES</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DetallePedidoModal

import { useState, useEffect, useMemo, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pedido as ApiPedido, Mesa, EstadoPedido } from '../data/pedidos'
import { listarMesas, cambiarEstado } from '../data/pedidos'
import type { PedidoPendiente, ItemPedidoPendiente } from '@/types/PedidoPendiente'
import { PedidosContext } from '../context/PedidosContext'
import { listarCategorias } from '../../menu/api/categorias'
import { listarSubcategorias } from '../../menu/api/subcategorias'
import type { Subcategoria } from '../../menu/api/subcategorias'
import { listarProductos } from '../../menu/api/productos'
import type { Producto } from '../../menu/api/productos'
import type { Abono } from '@/types/PedidoPendiente'
import { formatearPesos } from '@/utils/formatear'
import styles from './DetallePedidoModal.module.css'

type Pedido = ApiPedido | PedidoPendiente

interface DetallePedidoModalProps {
  pedido: Pedido
  onClose: () => void
}

type Modo = 'acciones' | 'agregar-quitar' | 'separar-cuenta' | 'unir-mesas' | 'cambiar-mesa' | 'abonar-dinero'

function formatPrecio(valor: number | undefined): string {
  if (valor == null || isNaN(valor)) return '—'
  const entero = Math.floor(valor)
  const decimal = Math.round((valor - entero) * 10)
  return decimal > 0 ? `${entero},${decimal}` : `${entero}`
}

function isApiPedido(p: Pedido): p is ApiPedido {
  return 'detalles' in p && 'mesaId' in p
}

function isPedidoPendienteObj(p: Pedido): p is PedidoPendiente {
  return 'items' in p && 'mesero' in p
}

function getMesaNumero(p: Pedido): string {
  try {
    if (isApiPedido(p)) return String(p.mesaId ?? '')
    return p.mesa?.replace(/\D/g, '') ?? ''
  } catch { return '' }
}

function getMesaNombre(p: Pedido): string {
  try {
    if (isApiPedido(p)) return p.mesa?.nombre ?? p.mesa?.id?.toString() ?? ''
    return p.mesa ?? ''
  } catch { return '' }
}

function getComandaId(p: Pedido): string {
  return String(p?.id ?? '')
}

function getHoraComanda(p: Pedido): string {
  try {
    if (isApiPedido(p)) {
      if (!p.creadoEn) return '—'
      return new Date(p.creadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    }
    return p.horaCreacion ?? '—'
  } catch { return '—' }
}

function getMesero(p: Pedido): string {
  if (isApiPedido(p)) return p.usuario?.rol ?? '—'
  return p.mesero ?? '—'
}

interface ProductoRow {
  nombre: string
  precioUnitario: number
  cantidad: number
  subtotal: number
}

function getProductos(p: Pedido): ProductoRow[] {
  try {
    if (isApiPedido(p)) {
      if (!Array.isArray(p.detalles)) return []
      return p.detalles
        .filter((d) => d != null)
        .map((d) => ({
          nombre: d.producto?.nombre ?? 'Producto',
          precioUnitario: d.precioUnitario ?? 0,
          cantidad: d.cantidad ?? 0,
          subtotal: (d.precioUnitario ?? 0) * (d.cantidad ?? 0),
        }))
    }
    return Array.isArray(p.items) ? p.items : []
  } catch { return [] }
}

function formatearInputPesos(valor: string): { valorNumerico: number; valorFormateado: string } {
  const soloDigitos = valor.replace(/\D/g, '')
  const valorNumerico = soloDigitos ? parseInt(soloDigitos, 10) : 0
  const valorFormateado = new Intl.NumberFormat('es-CO').format(valorNumerico)
  return { valorNumerico, valorFormateado }
}

function obtenerColumnaDestinoEnUso(asignaciones: Record<string, number>): number | null {
  const columnasUsadas = new Set(Object.values(asignaciones).filter((c) => c !== 1))
  if (columnasUsadas.size === 0) return null
  if (columnasUsadas.size === 1) return [...columnasUsadas][0]
  return null
}

function DetallePedidoModal({ pedido, onClose }: DetallePedidoModalProps) {
  const pedidosCtx = useContext(PedidosContext)
  const actualizarPedido = pedidosCtx?.actualizarPedido
  const pedidosPendientes = pedidosCtx?.pedidosPendientes ?? []

  const queryClient = useQueryClient()
  const cambiarEstadoApi = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
    },
    onError: (err) => console.error('Error al cambiar estado:', err),
  })
  const [modo, setModo] = useState<Modo>('acciones')
  const [draftItems, setDraftItems] = useState<ItemPedidoPendiente[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null)
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({})
  const [maxCuenta, setMaxCuenta] = useState(1)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string | null>(null)
  const [montoIngresado, setMontoIngresado] = useState(0)

  const { data: mesasDisponibles = [] } = useQuery({
    queryKey: ['mesas'],
    queryFn: listarMesas,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (categoriaActiva === null) {
      setSubcategorias([])
      setSubcategoriaActiva(null)
      return
    }
    listarSubcategorias(categoriaActiva)
      .then(setSubcategorias)
      .catch(() => setSubcategorias([]))
  }, [categoriaActiva])

  const { data: catalogo = [] } = useQuery({
    queryKey: ['productos-catalogo', categoriaActiva, subcategoriaActiva],
    queryFn: () => {
      const params: { categoriaId?: number; subcategoriaId?: number } = {}
      if (categoriaActiva) params.categoriaId = categoriaActiva
      if (subcategoriaActiva) params.subcategoriaId = subcategoriaActiva
      return listarProductos(Object.keys(params).length > 0 ? params : undefined)
    },
    staleTime: 1000 * 60 * 5,
  })

  if (!pedido) return null

  const mesaNum = getMesaNumero(pedido)
  const mesaNombre = getMesaNombre(pedido)
  const comandaId = getComandaId(pedido)
  const horaComanda = getHoraComanda(pedido)
  const mesero = getMesero(pedido)
  const productosActuales = getProductos(pedido)

  const pedidoPendiente = isPedidoPendienteObj(pedido)
    ? pedidosPendientes.find((p) => p.id === pedido.id) ?? pedido
    : pedidosPendientes.find((p) => p.mesa === mesaNombre) ?? null

  const itemsOriginales: ItemPedidoPendiente[] = pedidoPendiente
    ? (Array.isArray(pedidoPendiente.items) ? pedidoPendiente.items : [])
    : (Array.isArray(productosActuales) ? productosActuales.map((p) => ({
        nombre: p.nombre ?? '',
        cantidad: p.cantidad ?? 0,
        precioUnitario: p.precioUnitario ?? 0,
        subtotal: p.subtotal ?? 0,
      })) : [])

  const saldoPendiente = pedidoPendiente
    ? (pedidoPendiente.total ?? 0) - (pedidoPendiente.totalAbonado ?? 0)
    : (productosActuales ?? []).reduce((sum, p) => sum + (p.subtotal ?? 0), 0)

  const montoValido = montoIngresado > 0 && montoIngresado <= saldoPendiente
  const montoError = montoIngresado > saldoPendiente ? 'El monto no puede ser mayor al total de la cuenta' : ''

  const catalogoFiltrado = useMemo(() => {
    const items = Array.isArray(catalogo) ? catalogo : []
    const filtrados = busqueda
      ? items.filter((p) => p?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
      : items
    return filtrados.filter((p) => p?.habilitado !== false)
  }, [catalogo, busqueda])

  const originalStr = JSON.stringify(
    (itemsOriginales ?? []).map((i) => ({ nombre: i?.nombre, cantidad: i?.cantidad, precioUnitario: i?.precioUnitario }))
  )
  const draftStr = JSON.stringify(
    (draftItems ?? []).map((i) => ({ nombre: i?.nombre, cantidad: i?.cantidad, precioUnitario: i?.precioUnitario }))
  )
  const hasChanges = originalStr !== draftStr

  function entrarAgregarQuitar() {
    setDraftItems((itemsOriginales ?? []).map((i) => ({ ...i })))
    setCategoriaActiva(null)
    setSubcategoriaActiva(null)
    setSubcategorias([])
    setBusqueda('')
    setModo('agregar-quitar')
  }

  function volverAcciones() {
    setDraftItems([])
    setAsignaciones({})
    setMaxCuenta(1)
    setMesaSeleccionada(null)
    setMontoIngresado(0)
    setModo('acciones')
  }

  function agregarProducto(producto: Producto) {
    if (!producto) return
    setDraftItems((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const idx = arr.findIndex((i) => i.nombre === producto.nombre)
      if (idx >= 0) {
        const updated = [...arr]
        const nuevaCant = (updated[idx].cantidad ?? 0) + 1
        updated[idx] = {
          ...updated[idx],
          cantidad: nuevaCant,
          subtotal: nuevaCant * (updated[idx].precioUnitario ?? 0),
        }
        return updated
      }
      return [...arr, {
        nombre: producto.nombre ?? 'Producto',
        cantidad: 1,
        precioUnitario: producto.precio ?? 0,
        subtotal: producto.precio ?? 0,
        requierePreparacion: producto.requierePreparacion,
      }]
    })
  }

  function quitarProducto(nombre: string) {
    setDraftItems((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const idx = arr.findIndex((i) => i.nombre === nombre)
      if (idx < 0) return arr
      const item = arr[idx]
      if ((item.cantidad ?? 0) <= 1) {
        return arr.filter((i) => i.nombre !== nombre)
      }
      const updated = [...arr]
      const nuevaCant = (item.cantidad ?? 0) - 1
      updated[idx] = {
        ...item,
        cantidad: nuevaCant,
        subtotal: nuevaCant * (item.precioUnitario ?? 0),
      }
      return updated
    })
  }

  function confirmarCambios() {
    const itemsNorm = Array.isArray(draftItems) ? draftItems : []

    const huboProductoNuevoConPreparacion = itemsNorm.some(draftItem => {
      const original = (itemsOriginales ?? []).find(i => i.nombre === draftItem.nombre)
      const cantidadAgregada = (draftItem.cantidad ?? 0) - (original?.cantidad ?? 0)
      if (cantidadAgregada <= 0) return false
      return draftItem.requierePreparacion === true
    })

    const pedidoEstado = String((pedido as any).estado ?? '').toLowerCase()
    const debeRevertirAEstado = pedidoEstado === 'hecho' && huboProductoNuevoConPreparacion

    if (actualizarPedido) {
      const targetId = pedidoPendiente ? pedidoPendiente.id : String(pedido.id)
      const pedidoEstadoActual = String((pedido as any).estado ?? '').toUpperCase()
      const estadoValido = ['RECIBIDO', 'PENDIENTE', 'HECHO', 'FINALIZADO'].includes(pedidoEstadoActual)
        ? pedidoEstadoActual as PedidoPendiente['estado']
        : 'PENDIENTE'
      actualizarPedido(targetId, itemsNorm, {
        mesa: mesaNombre,
        mesero: mesero,
        horaCreacion: horaComanda,
        estado: estadoValido,
      })
      if (debeRevertirAEstado && pedidosCtx?.cambiarEstado) {
        pedidosCtx.cambiarEstado(targetId, 'PENDIENTE')
      }
    }

    if (debeRevertirAEstado) {
      cambiarEstadoApi.mutate({ id: Number(pedido.id), estado: 'pendiente' })
    }

    setModo('acciones')
  }

  function entrarSepararCuenta() {
    const nombres = (productosActuales ?? []).map((p) => p?.nombre ?? '').filter(Boolean)
    const init: Record<string, number> = {}
    nombres.forEach((n) => { init[n] = 1 })
    setAsignaciones(init)
    setMaxCuenta(1)
    setModo('separar-cuenta')
  }

  function agregarCuenta() {
    setMaxCuenta((prev) => prev + 1)
  }

  function asignarCuenta(nombre: string, cuenta: number) {
    setAsignaciones((prev) => ({ ...prev, [nombre]: cuenta }))
  }

  function confirmarSeparar() {
    if (!hayMovimiento) return
    const columnaEnUsoActual = obtenerColumnaDestinoEnUso(asignaciones)
    if (columnaEnUsoActual === null && Object.values(asignaciones).some((v) => v !== 1)) {
      console.error('Error: solo se puede dividir hacia una cuenta a la vez')
      return
    }
    const cuentas = Object.keys(asignaciones)
    if (cuentas.length === 0) return
    const agrupado: Record<number, ItemPedidoPendiente[]> = {}
    for (const [nombre, cuenta] of Object.entries(asignaciones)) {
      if (!agrupado[cuenta]) agrupado[cuenta] = []
      const item = (productosActuales ?? []).find((p) => p?.nombre === nombre)
      if (item) {
        agrupado[cuenta].push({
          nombre: item.nombre ?? nombre,
          cantidad: item.cantidad ?? 0,
          precioUnitario: item.precioUnitario ?? 0,
          subtotal: item.subtotal ?? 0,
        })
      }
    }
    const itemsPorCuenta = Object.entries(agrupado)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, items]) => items)
    if (pedidoPendiente && pedidosCtx?.separarCuenta) {
      pedidosCtx.separarCuenta(pedidoPendiente.id, itemsPorCuenta)
    } else {
      console.log('Separar cuenta (API pedido - no implementado):', itemsPorCuenta)
    }
    setModo('acciones')
  }

  function entrarUnirMesas() {
    setMesaSeleccionada(null)
    setModo('unir-mesas')
  }

  function seleccionarMesa(nombre: string) {
    setMesaSeleccionada((prev) => prev === nombre ? null : nombre)
  }

  function confirmarUnion() {
    if (!mesaSeleccionada) return
    if (pedidoPendiente && pedidosCtx?.unirPedidos) {
      pedidosCtx.unirPedidos(pedidoPendiente.id, mesaSeleccionada)
    } else {
      console.log('Unir mesas (API pedido - no implementado):', mesaSeleccionada)
    }
    setModo('acciones')
  }

  const otrasMesas = mesasDisponibles.filter((m) => m.nombre !== mesaNombre)

  function entrarAbonarDinero() {
    setMontoIngresado(0)
    setModo('abonar-dinero')
  }

  function confirmarAbono() {
    if (!montoValido) return
    const ahora = new Date()
    const hh = String(ahora.getHours()).padStart(2, '0')
    const mm = String(ahora.getMinutes()).padStart(2, '0')
    const abono: Abono = {
      monto: montoIngresado,
      metodo: 'Efectivo',
      hora: `${hh}:${mm}`,
    }
    if (pedidoPendiente && pedidosCtx?.registrarAbono) {
      pedidosCtx.registrarAbono(pedidoPendiente.id, abono)
    } else {
      console.log('Abonar dinero (API pedido - no implementado):', abono)
    }
    setModo('acciones')
  }

  const columnaEnUso = obtenerColumnaDestinoEnUso(asignaciones)
  const hayMovimiento = Object.values(asignaciones).some((v) => v !== 1)

  const mesasOcupadas = new Set(
    pedidosPendientes.filter((p) => p.mesa !== mesaNombre).map((p) => p.mesa)
  )
  const mesasLibres = mesasDisponibles.filter(
    (m) => m.nombre !== mesaNombre && !mesasOcupadas.has(m.nombre)
  )

  function entrarCambiarMesa() {
    setMesaSeleccionada(null)
    setModo('cambiar-mesa')
  }

  function confirmarCambioMesa() {
    if (!mesaSeleccionada) return
    if (pedidoPendiente && pedidosCtx?.cambiarMesaPedido) {
      pedidosCtx.cambiarMesaPedido(pedidoPendiente.id, mesaSeleccionada)
    } else {
      console.log('Cambiar mesa (API pedido - no implementado):', mesaSeleccionada)
    }
    setModo('acciones')
  }

  const acciones = [
    {
      titulo: 'AGREGAR/QUITAR PRODUCTOS',
      descripcion: 'Añade o quita items desde el catálogo al pedido actual.',
      icono: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      onClick: entrarAgregarQuitar,
    },
    {
      titulo: 'SEPARAR CUENTAS',
      descripcion: 'Divide el cobro en montos distintos entre comensales.',
      icono: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
      onClick: entrarSepararCuenta,
    },
    {
      titulo: 'UNIR MESAS',
      descripcion: 'Fusiona el pedido de otra mesa en un solo recibo.',
      icono: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20l5-5M20 4l-5 5" />
        </svg>
      ),
      onClick: entrarUnirMesas,
    },
    {
      titulo: 'CAMBIAR MESA',
      descripcion: 'Reasigna el pedido a una mesa disponible.',
      icono: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      onClick: entrarCambiarMesa,
    },
    {
      titulo: 'ABONAR DINERO',
      descripcion: 'Resta un monto abonado de la cuenta total de la mesa.',
      icono: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: entrarAbonarDinero,
    },
  ]

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaCircle}>{mesaNum || '?'}</div>
            <div>
              <h2 className={styles.headerTitle}>MESA {mesaNombre.replace?.(/[^0-9]/g, '') || mesaNombre || '?'} • DETALLES</h2>
              <p className={styles.headerSubtitle}>Comanda #{comandaId || '?'}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoRow}>
            <div>
              <div className={styles.infoLabel}>HORA COMANDA</div>
              <div className={styles.infoValue}>{horaComanda}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>MESERO ATIENDE</div>
              <div className={styles.infoValue}>{mesero}</div>
            </div>
          </div>

          {modo === 'acciones' && (
            <>
              <h3 className={styles.sectionTitle}>PRODUCTOS SOLICITADOS</h3>
              <div className={styles.divider} />

              <div className={styles.productosScroll}>
                {(productosActuales ?? []).map((item, i) => (
                  <div key={i} className={styles.productoRow}>
                    <div className={styles.productoInfo}>
                      <span className={styles.productoName}>{item?.nombre ?? ''}</span>
                      <span className={styles.productoUnitDetail}>
                        ${formatPrecio(item?.precioUnitario)} c/u &times; {item?.cantidad ?? 0}
                      </span>
                    </div>
                    <span className={styles.productoSubtotal}>${formatPrecio(item?.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />
            </>
          )}

          {modo === 'acciones' && (
            <>
              <h3 className={styles.sectionTitleGray}>ACCIONES DEL PEDIDO</h3>
              <div className={styles.divider} />

              <div className={styles.accionesGrid}>
                {acciones.map((accion, i) => (
                  <button key={i} className={styles.accionCard} onClick={accion.onClick}>
                    <div className={styles.accionIcon}>
                      {accion.icono}
                    </div>
                    <span className={styles.accionTitle}>{accion.titulo}</span>
                    <span className={styles.accionDesc}>{accion.descripcion}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {modo === 'agregar-quitar' && (
            <>
              <div className={styles.editPanel}>
                <div className={styles.editHeader}>
                  <span className={styles.editHeaderTitle}>AGREGAR/QUITAR PRODUCTOS</span>
                  <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
                </div>

                <div className={styles.editFilters}>
                  <button
                    className={`${styles.filterPill} ${categoriaActiva === null ? styles.filterPillActive : ''}`}
                    onClick={() => setCategoriaActiva(null)}
                  >
                    TODOS
                  </button>
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      className={`${styles.filterPill} ${categoriaActiva === cat.id ? styles.filterPillActive : ''}`}
                      onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? null : cat.id)}
                    >
                      {cat.nombre.toUpperCase()}
                    </button>
                  ))}
                  <input
                    className={styles.editSearchInput}
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                {categoriaActiva !== null && subcategorias.length > 0 && (
                  <div className={styles.subcategoriasRow}>
                    {subcategorias.map((sub) => (
                      <button
                        key={sub.id}
                        className={`${styles.filterPill} ${subcategoriaActiva === sub.id ? styles.filterPillActive : ''}`}
                        onClick={() => setSubcategoriaActiva(subcategoriaActiva === sub.id ? null : sub.id)}
                      >
                        {sub.nombre.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}

                <div className={styles.catalogoList}>
                  {(catalogoFiltrado ?? []).map((producto) => (
                    <div key={producto?.id ?? Math.random()} className={styles.catalogoItem}>
                      <div className={styles.catalogoItemInfo}>
                        <span className={styles.catalogoItemName}>{producto?.nombre ?? ''}</span>
                        <span className={styles.catalogoItemPrice}>${formatPrecio(producto?.precio)}</span>
                      </div>
                      <button className={styles.btnAdd} onClick={() => agregarProducto(producto)}>+</button>
                    </div>
                  ))}
                  {(!catalogoFiltrado || catalogoFiltrado.length === 0) && (
                    <p className={styles.emptyText}>No se encontraron productos</p>
                  )}
                </div>
              </div>

              <div className={styles.divider} />

              <h3 className={styles.currentItemsTitle}>PRODUCTOS ACTUALES DEL PEDIDO</h3>

              <div className={styles.currentItemsList}>
                {(!draftItems || draftItems.length === 0) ? (
                  <p className={styles.emptyText}>No hay productos en el pedido</p>
                ) : (
                  draftItems.map((item, i) => (
                    <div key={i} className={styles.currentItem}>
                      <div className={styles.currentItemInfo}>
                        <span className={styles.currentItemName}>{item?.nombre ?? ''}</span>
                        <span className={styles.currentItemQty}>x{item?.cantidad ?? 0}</span>
                      </div>
                      <button className={styles.btnRemove} onClick={() => quitarProducto(item?.nombre)}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {modo === 'separar-cuenta' && (
            <>
              <div className={styles.editPanel}>
                <div className={styles.editHeader}>
                  <span className={styles.editHeaderTitle}>SEPARAR CUENTAS</span>
                  <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
                </div>
                <p className={styles.separarInstruccion}>
                  Asigna cada producto a una cuenta presionando el número deseado. Puedes agregar más cuentas con el botón +.
                </p>
                <div className={styles.separarList}>
                  {(productosActuales ?? []).map((item, i) => {
                    const nombre = item?.nombre ?? ''
                    if (!nombre) return null
                    const cuentaActual = asignaciones[nombre] ?? 1
                    return (
                      <div key={i} className={styles.separarItem}>
                        <span className={styles.separarItemName}>{nombre}</span>
                        <span className={styles.separarBadge}>x{item?.cantidad ?? 0}</span>
                        <div className={styles.separarBotones}>
                          {Array.from({ length: maxCuenta }, (_, j) => j + 1).map((num) => {
                            const isDisabled = num !== 1 && columnaEnUso !== null && columnaEnUso !== num
                            return (
                              <button
                                key={num}
                                className={`${styles.separarBtn} ${cuentaActual === num ? styles.separarBtnActivo : ''} ${isDisabled ? styles.separarBtnDisabled : ''}`}
                                onClick={() => !isDisabled && asignarCuenta(nombre, num)}
                              >
                                {num}
                              </button>
                            )
                          })}
                          <button className={styles.separarBtnAdd} onClick={agregarCuenta}>+</button>
                        </div>
                      </div>
                    )
                  })}
                  {(!productosActuales || productosActuales.length === 0) && (
                    <p className={styles.emptyText}>No hay productos en el pedido</p>
                  )}
                </div>
              </div>
            </>
          )}

          {modo === 'unir-mesas' && (
            <>
              <div className={styles.editPanel}>
                <div className={styles.editHeader}>
                  <span className={styles.editHeaderTitle}>UNIR MESAS</span>
                  <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
                </div>
                <p className={styles.unirDescripcion}>
                  Seleccione una mesa para fusionar su pedido con la {mesaNombre}.
                </p>
                <div className={styles.unirGrid}>
                  {(otrasMesas ?? []).map((mesa) => {
                    const mesaPedido = pedidosPendientes.find((p) => p.mesa === mesa.nombre)
                    const isSelected = mesaSeleccionada === mesa.nombre
                    return (
                      <div
                        key={mesa.id}
                        className={`${styles.unirCard} ${isSelected ? styles.unirCardSel : ''}`}
                        onClick={() => seleccionarMesa(mesa.nombre)}
                      >
                        <span className={styles.unirCardName}>{mesa.nombre}</span>
                        <div className={styles.unirCardInfo}>
                          <span className={styles.unirCardEstadoSin}>{mesa.ubicacion}</span>
                          {mesaPedido ? (
                            <span className={styles.unirCardEstadoActual}>CON PEDIDO</span>
                          ) : (
                            <span className={styles.unirCardEstadoSin}>Sin pedido</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {modo === 'cambiar-mesa' && (
            <>
              <div className={styles.editPanel}>
                <div className={styles.editHeader}>
                  <span className={styles.editHeaderTitle}>CAMBIAR MESA</span>
                  <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
                </div>
                <p className={styles.unirDescripcion}>
                  Seleccione la mesa a la que desea reasignar este pedido.
                </p>
                <div className={styles.unirGrid}>
                  {(mesasLibres ?? []).length === 0 ? (
                    <p className={styles.emptyText}>No hay mesas libres disponibles</p>
                  ) : (
                    (mesasLibres ?? []).map((mesa) => {
                      const isSelected = mesaSeleccionada === mesa.nombre
                      return (
                        <div
                          key={mesa.id}
                          className={`${styles.unirCard} ${isSelected ? styles.unirCardSel : ''}`}
                          onClick={() => seleccionarMesa(mesa.nombre)}
                        >
                          <span className={styles.unirCardName}>{mesa.nombre}</span>
                          <div className={styles.unirCardInfo}>
                            <span className={styles.unirCardEstadoSin}>{mesa.ubicacion}</span>
                            <span className={styles.unirCardEstadoSin}>Libre</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}

          {modo === 'abonar-dinero' && (
            <>
              <div className={styles.editPanel}>
                <div className={styles.editHeader}>
                  <span className={styles.editHeaderTitle}>ABONAR DINERO</span>
                  <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
                </div>
                <p className={styles.separarInstruccion}>
                  Ingrese el monto que el cliente abona a la cuenta.
                </p>
                <div className={styles.abonoTotalRow}>
                  <span className={styles.abonoLabel}>MONTO A ABONAR ($)</span>
                </div>
                <input
                  className={styles.abonoInput}
                  type="text"
                  inputMode="numeric"
                  placeholder="$ 0"
                  value={montoIngresado > 0 ? formatearInputPesos(String(montoIngresado)).valorFormateado : ''}
                  onChange={(e) => {
                    const { valorNumerico } = formatearInputPesos(e.target.value)
                    setMontoIngresado(valorNumerico)
                  }}
                />
                {montoError && <p className={styles.abonoError}>{montoError}</p>}
                <div className={styles.abonoSaldoRow}>
                  <span className={styles.abonoLabel}>CUENTA ACTUAL DE LA MESA</span>
                  <span className={styles.abonoTotal}>${formatearPesos(saldoPendiente)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          {modo === 'agregar-quitar' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!hasChanges} onClick={confirmarCambios}>
                CONFIRMAR CAMBIOS
              </button>
            </>
          ) : modo === 'separar-cuenta' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!hayMovimiento} onClick={confirmarSeparar}>
                CONFIRMAR DIVISIÓN
              </button>
            </>
          ) : modo === 'unir-mesas' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada} onClick={confirmarUnion}>
                FUSIONAR MESAS
              </button>
            </>
          ) : modo === 'cambiar-mesa' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada} onClick={confirmarCambioMesa}>
                CAMBIAR MESA
              </button>
            </>
          ) : modo === 'abonar-dinero' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!montoValido} onClick={confirmarAbono}>
                CONFIRMAR ABONO
              </button>
            </>
          ) : (
            <button className={styles.btnCerrar} onClick={onClose}>CERRAR DETALLES</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetallePedidoModal

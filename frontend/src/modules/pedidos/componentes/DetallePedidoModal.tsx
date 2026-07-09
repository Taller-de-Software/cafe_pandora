import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PedidoPendiente, ItemPedidoPendiente, Abono } from '@/types/PedidoPendiente'
import { usePedidos } from '../context/PedidosContext'
import { useTables } from '@/hooks/useTables'
import { formatearHora } from '@/utils/formatear'
import { listarCategorias } from '../../menu/api/categorias'
import { listarProductos } from '../../menu/api/productos'
import type { Producto } from '../../menu/api/productos'
import styles from './DetallePedidoModal.module.css'

interface DetallePedidoModalProps {
  pedido: PedidoPendiente
  onClose: () => void
}

type Modo = 'acciones' | 'agregar-quitar' | 'separar-cuenta' | 'unir-mesas' | 'cambiar-mesa' | 'abonar-dinero'
type Asignacion = [number, number, number]

function formatPrecio(valor: number | undefined): string {
  if (valor == null || isNaN(valor)) return '—'
  const entero = Math.floor(valor)
  const decimal = Math.round((valor - entero) * 10)
  return decimal > 0 ? `${entero},${decimal}` : `${entero}`
}

function DetallePedidoModal({ pedido, onClose }: DetallePedidoModalProps) {
  const { actualizarPedido, agregarPedido, eliminarPedido, pedidosPendientes, cambiarMesaPedido, registrarAbono } = usePedidos()
  const { tables, setTableStatus } = useTables()
  const [modo, setModo] = useState<Modo>('acciones')
  const [draftItems, setDraftItems] = useState<ItemPedidoPendiente[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [asignaciones, setAsignaciones] = useState<Record<string, Asignacion>>({})
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string | null>(null)
  const [showFusionConfirm, setShowFusionConfirm] = useState(false)
  const [montoAbono, setMontoAbono] = useState('')

  const pedidoDeMesa = (tableName: string, tableType: string): PedidoPendiente | undefined =>
    pedidosPendientes.find((p) => p.mesa === `Mesa ${tableName} (${tableType})`)

  function mesaTienePedido(tableName: string, tableType: string): boolean {
    return !!pedidoDeMesa(tableName, tableType)
  }

  function getMinutosReserva(table: { status: string; reservation?: { fecha: string; hora: string } }): number | null {
    if (table.status !== 'RESERVADA' || !table.reservation?.hora) return null
    const ahora = new Date()
    const [h, m] = table.reservation.hora.split(':').map(Number)
    const reservaDate = new Date(ahora)
    reservaDate.setHours(h, m, 0, 0)
    return Math.round((reservaDate.getTime() - ahora.getTime()) / 60000)
  }

  function mesaDisponible(table: { status: string; reservation?: { fecha: string; hora: string } }): boolean {
    if (table.status === 'VACÍA') return true
    if (table.status === 'OCUPADA') return true
    if (table.status === 'RESERVADA') {
      const mins = getMinutosReserva(table)
      if (mins === null) return true
      if (mins > 20) return true
      if (mins <= 10) return true
      return false
    }
    return true
  }

  function getEstadoMesa(table: { status: string; reservation?: { fecha: string; hora: string } }): string {
    if (table.status === 'VACÍA') return 'Libre'
    if (table.status === 'OCUPADA') return 'Ocupada'
    if (table.status === 'RESERVADA') {
      const mins = getMinutosReserva(table)
      if (mins !== null && mins <= 20 && mins > 10) return 'Reservada próximamente'
      return 'Reservada'
    }
    return table.status
  }

  useEffect(() => {
    if (!pedido) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [pedido, onClose])

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
    staleTime: 1000 * 60 * 5,
  })

  const { data: catalogo = [] } = useQuery({
    queryKey: ['productos-catalogo', categoriaActiva],
    queryFn: () => listarProductos(categoriaActiva ? { categoriaId: categoriaActiva } : undefined),
    staleTime: 1000 * 60 * 5,
  })

  if (!pedido) return null

  const mesaNum = pedido.mesa.replace(/\D/g, '')

  const catalogoFiltrado = useMemo(() => {
    const filtrados = busqueda
      ? catalogo.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      : catalogo
    return filtrados.filter((p) => p.habilitado !== false)
  }, [catalogo, busqueda])

  const originalItemsStr = JSON.stringify(pedido.items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })))
  const draftItemsStr = JSON.stringify(draftItems.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })))
  const hasChanges = originalItemsStr !== draftItemsStr

  const hayMovimientos = pedido.items.some((item) => {
    const a = asignaciones[item.nombre]
    return a && (a[1] > 0 || a[2] > 0)
  })

  const pedidoActual = pedidosPendientes.find((p) => p.id === pedido.id) ?? pedido
  const totalCuenta = pedido.items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalAbonado = pedidoActual.abonos?.reduce((sum, a) => sum + a.monto, 0) ?? 0
  const saldoPendiente = totalCuenta - totalAbonado
  const montoNum = parseFloat(montoAbono)
  const montoValido = !isNaN(montoNum) && montoNum > 0 && montoNum <= saldoPendiente
  const excedeSaldo = !isNaN(montoNum) && montoNum > saldoPendiente

  function entrarAgregarQuitar() {
    setDraftItems(pedido.items.map((i) => ({ ...i })))
    setCategoriaActiva(null)
    setBusqueda('')
    setModo('agregar-quitar')
  }

  function entrarSepararCuenta() {
    const inicial: Record<string, Asignacion> = {}
    pedido.items.forEach((item) => {
      inicial[item.nombre] = [0, 0, 0]
    })
    setAsignaciones(inicial)
    setModo('separar-cuenta')
  }

  function entrarUnirMesas() {
    setMesaSeleccionada(null)
    setShowFusionConfirm(false)
    setModo('unir-mesas')
  }

  function entrarCambiarMesa() {
    setMesaSeleccionada(null)
    setModo('cambiar-mesa')
  }

  function entrarAbonarDinero() {
    setMontoAbono('')
    setModo('abonar-dinero')
  }

  function volverAcciones() {
    setDraftItems([])
    setAsignaciones({})
    setMesaSeleccionada(null)
    setShowFusionConfirm(false)
    setMontoAbono('')
    setModo('acciones')
  }

  function confirmarCambios() {
    actualizarPedido(pedido.id, draftItems)
    setModo('acciones')
  }

  function confirmarSeparar() {
    const itemsRestantes: ItemPedidoPendiente[] = []
    pedido.items.forEach((item) => {
      const a = asignaciones[item.nombre] ?? [0, 0, 0]
      const enCuenta1 = item.cantidad - a[1] - a[2]
      if (enCuenta1 > 0) {
        itemsRestantes.push({
          nombre: item.nombre,
          cantidad: enCuenta1,
          precioUnitario: item.precioUnitario,
          subtotal: enCuenta1 * item.precioUnitario,
        })
      }
    })
    actualizarPedido(pedido.id, itemsRestantes)
    for (let c = 1; c < 3; c++) {
      const itemsCuenta: ItemPedidoPendiente[] = []
      pedido.items.forEach((item) => {
        const cantidad = asignaciones[item.nombre]?.[c] ?? 0
        if (cantidad > 0) {
          itemsCuenta.push({
            nombre: item.nombre,
            cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: cantidad * item.precioUnitario,
          })
        }
      })
      if (itemsCuenta.length > 0) {
        agregarPedido(pedido.mesa, itemsCuenta, pedido.mesero)
      }
    }
    setModo('acciones')
    onClose()
  }

  function agregarProducto(producto: Producto) {
    setDraftItems((prev) => {
      const idx = prev.findIndex((i) => i.nombre === producto.nombre)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1, subtotal: (updated[idx].cantidad + 1) * updated[idx].precioUnitario }
        return updated
      }
      return [...prev, { nombre: producto.nombre, cantidad: 1, precioUnitario: producto.precio, subtotal: producto.precio }]
    })
  }

  function quitarProducto(nombre: string) {
    setDraftItems((prev) => {
      const idx = prev.findIndex((i) => i.nombre === nombre)
      if (idx < 0) return prev
      const item = prev[idx]
      if (item.cantidad <= 1) {
        return prev.filter((i) => i.nombre !== nombre)
      }
      const updated = [...prev]
      updated[idx] = { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.precioUnitario }
      return updated
    })
  }

  function asignarUnidad(nombre: string, cuenta: 0 | 1 | 2) {
    setAsignaciones((prev) => {
      const item = pedido.items.find((i) => i.nombre === nombre)
      if (!item) return prev
      const actual = prev[nombre] ?? [0, 0, 0]
      const asignadas = actual[0] + actual[1] + actual[2]
      if (asignadas >= item.cantidad) return prev
      const nuevo: Asignacion = [...actual]
      nuevo[cuenta] += 1
      return { ...prev, [nombre]: nuevo }
    })
  }

  function ejecutarFusion() {
    if (!mesaSeleccionada) return
    const target = tables.find((t) => t.id === mesaSeleccionada)
    if (!target) return
    const sourcePedido = pedidoDeMesa(target.name, target.type)
    if (!sourcePedido) return
    const itemsFusionados: ItemPedidoPendiente[] = [...pedido.items]
    sourcePedido.items.forEach((srcItem) => {
      const idx = itemsFusionados.findIndex((i) => i.nombre === srcItem.nombre)
      if (idx >= 0) {
        const nuevaCant = itemsFusionados[idx].cantidad + srcItem.cantidad
        itemsFusionados[idx] = { ...itemsFusionados[idx], cantidad: nuevaCant, subtotal: nuevaCant * itemsFusionados[idx].precioUnitario }
      } else {
        itemsFusionados.push({ ...srcItem })
      }
    })
    actualizarPedido(pedido.id, itemsFusionados)
    eliminarPedido(sourcePedido.id)
    if (target.reservation) {
      setTableStatus(target.id, 'RESERVADA')
    } else {
      setTableStatus(target.id, 'VACÍA')
    }
    setShowFusionConfirm(false)
    setModo('acciones')
    onClose()
  }

  function ejecutarAbono() {
    if (!montoValido) return
    const ahora = new Date()
    const hh = String(ahora.getHours()).padStart(2, '0')
    const mm = String(ahora.getMinutes()).padStart(2, '0')
    const abono: Abono = {
      monto: montoNum,
      metodo: 'Efectivo',
      hora: `${hh}:${mm}`,
    }
    registrarAbono(pedidoActual.id, abono)
    if (totalAbonado + montoNum >= totalCuenta) {
      eliminarPedido(pedidoActual.id)
      const mesaTbl = tables.find(
        (t) => `Mesa ${t.name} (${t.type})` === pedidoActual.mesa
      )
      if (mesaTbl) {
        if (mesaTbl.reservation) {
          setTableStatus(mesaTbl.id, 'RESERVADA')
        } else {
          setTableStatus(mesaTbl.id, 'VACÍA')
        }
      }
      onClose()
    } else {
      setMontoAbono('')
    }
  }

  function ejecutarCambioMesa() {
    if (!mesaSeleccionada) return
    const target = tables.find((t) => t.id === mesaSeleccionada)
    if (!target) return
    const mesaOrigen = pedido.mesa
    const mesaDestinoLabel = `Mesa ${target.name} (${target.type})`
    cambiarMesaPedido(pedido.id, mesaDestinoLabel)
    const mesaOrigenTable = tables.find(
      (t) => `Mesa ${t.name} (${t.type})` === mesaOrigen
    )
    if (mesaOrigenTable) {
      setTableStatus(mesaOrigenTable.id, 'VACÍA')
    }
    setTableStatus(target.id, 'OCUPADA')
    setModo('acciones')
    onClose()
  }

  const renderAcciones = () => (
    <>
      <h3 className={styles.sectionTitleGray}>ACCIONES DEL PEDIDO</h3>
      <div className={styles.divider} />

      <div className={styles.accionesGrid}>
        <button className={styles.accionCard} onClick={entrarAgregarQuitar}>
          <div className={styles.accionIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className={styles.accionTitle}>AGREGAR/QUITAR PRODUCTOS</span>
          <span className={styles.accionDesc}>Añade o quita items desde el catálogo al pedido actual.</span>
        </button>

        <button className={styles.accionCard} onClick={entrarSepararCuenta}>
          <div className={styles.accionIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
          <span className={styles.accionTitle}>SEPARAR CUENTAS</span>
          <span className={styles.accionDesc}>Divide el cobro en montos distintos entre comensales.</span>
        </button>

        <button className={styles.accionCard} onClick={entrarUnirMesas}>
          <div className={styles.accionIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20l5-5M20 4l-5 5" />
            </svg>
          </div>
          <span className={styles.accionTitle}>UNIR MESAS</span>
          <span className={styles.accionDesc}>Fusiona el pedido de otra mesa en un solo recibo.</span>
        </button>

        <button className={styles.accionCard} onClick={entrarCambiarMesa}>
          <div className={styles.accionIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className={styles.accionTitle}>CAMBIAR MESA</span>
          <span className={styles.accionDesc}>Reasigna el pedido a una mesa disponible.</span>
        </button>

        <button className={styles.accionCard} onClick={entrarAbonarDinero}>
          <div className={styles.accionIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className={styles.accionTitle}>ABONAR DINERO</span>
          <span className={styles.accionDesc}>Resta un monto abonado de la cuenta total de la mesa.</span>
        </button>
      </div>
    </>
  )

  const renderAgregarQuitar = () => (
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
        {categorias.filter((c) => c.nombre.toUpperCase() === 'PLATILLOS' || c.nombre.toUpperCase() === 'BEBIDAS').length > 0
          ? categorias
              .filter((c) => c.nombre.toUpperCase() === 'PLATILLOS' || c.nombre.toUpperCase() === 'BEBIDAS')
              .map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.filterPill} ${categoriaActiva === cat.id ? styles.filterPillActive : ''}`}
                  onClick={() => setCategoriaActiva(categoriaActiva === cat.id ? null : cat.id)}
                >
                  {cat.nombre.toUpperCase()}
                </button>
              ))
          : categorias.map((cat) => (
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

      <div className={styles.catalogoList}>
        {catalogoFiltrado.map((producto) => (
          <div key={producto.id} className={styles.catalogoItem}>
            <div className={styles.catalogoItemInfo}>
              <span className={styles.catalogoItemName}>{producto.nombre}</span>
              <span className={styles.catalogoItemPrice}>${formatPrecio(producto.precio)}</span>
            </div>
            <button className={styles.btnAdd} onClick={() => agregarProducto(producto)}>+</button>
          </div>
        ))}
        {catalogoFiltrado.length === 0 && (
          <p className={styles.emptyText}>No se encontraron productos</p>
        )}
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
              <button className={styles.btnRemove} onClick={() => quitarProducto(item.nombre)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )

  const renderSepararCuenta = () => (
    <div className={styles.editPanel}>
      <div className={styles.editHeader}>
        <span className={styles.editHeaderTitle}>SEPARAR CUENTAS</span>
        <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
      </div>

      <div className={styles.divider} />

      <h3 className={styles.currentItemsTitle}>PRODUCTOS DEL PEDIDO</h3>

      <div className={styles.separarList}>
        {pedido.items.map((item) => {
          const a = asignaciones[item.nombre] ?? [0, 0, 0]
          const asignadas = a[0] + a[1] + a[2]
          const restantes = item.cantidad - asignadas
          return (
            <div key={item.nombre} className={styles.separarItem}>
              <div className={styles.separarItemInfo}>
                <span className={styles.catalogoItemName}>{item.nombre}</span>
                <span className={styles.separarItemTotal}>
                  {item.cantidad > 1 ? `x${item.cantidad} — ` : ''}
                  {restantes > 0 ? (
                    <span className={styles.separarRestantes}>{restantes} sin asignar</span>
                  ) : (
                    <span className={styles.separarCompleto}>completo</span>
                  )}
                </span>
              </div>
              <div className={styles.separarBotones}>
                <button
                  className={`${styles.separarBtn} ${a[1] > 0 ? styles.separarBtnActivo : ''}`}
                  onClick={() => asignarUnidad(item.nombre, 1)}
                >
                  2{a[1] > 0 && <span className={styles.separarBadge}>{a[1]}</span>}
                </button>
                <button
                  className={`${styles.separarBtn} ${a[2] > 0 ? styles.separarBtnActivo : ''}`}
                  onClick={() => asignarUnidad(item.nombre, 2)}
                >
                  3{a[2] > 0 && <span className={styles.separarBadge}>{a[2]}</span>}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.divider} />

      <div className={styles.separarResumen}>
        <div className={styles.separarResumenCuenta}>
          <span className={styles.separarResumenTitulo}>Cuenta 1 (no movidos)</span>
          {pedido.items.map((item) => {
            const a = asignaciones[item.nombre] ?? [0, 0, 0]
            const enCuenta1 = item.cantidad - a[1] - a[2]
            if (enCuenta1 <= 0) return null
            return (
              <div key={item.nombre} className={styles.separarResumenItem}>
                <span>{item.nombre} x{enCuenta1}</span>
                <span>${formatPrecio(enCuenta1 * item.precioUnitario)}</span>
              </div>
            )
          })}
          <div className={styles.separarResumenTotal}>
            <span>Total:</span>
            <span>${formatPrecio(
              pedido.items.reduce((sum, item) => {
                const a = asignaciones[item.nombre] ?? [0, 0, 0]
                const enCuenta1 = item.cantidad - a[1] - a[2]
                return sum + enCuenta1 * item.precioUnitario
              }, 0)
            )}</span>
          </div>
        </div>
        {[1, 2].map((c) => {
          const cuentaItems = pedido.items.filter((item) => (asignaciones[item.nombre]?.[c] ?? 0) > 0)
          if (cuentaItems.length === 0) return null
          const total = cuentaItems.reduce((sum, item) => sum + (asignaciones[item.nombre]?.[c] ?? 0) * item.precioUnitario, 0)
          return (
            <div key={c} className={styles.separarResumenCuenta}>
              <span className={styles.separarResumenTitulo}>Cuenta {c + 1}</span>
              {cuentaItems.map((item) => (
                <div key={item.nombre} className={styles.separarResumenItem}>
                  <span>{item.nombre} x{asignaciones[item.nombre]?.[c]}</span>
                  <span>${formatPrecio((asignaciones[item.nombre]?.[c] ?? 0) * item.precioUnitario)}</span>
                </div>
              ))}
              <div className={styles.separarResumenTotal}>
                <span>Total:</span>
                <span>${formatPrecio(total)}</span>
              </div>
            </div>
          )
        })}
        {!hayMovimientos && (
          <p className={styles.emptyText}>Usa los botones 2 y 3 para mover productos a otras cuentas</p>
        )}
      </div>
    </div>
  )

  const renderUnirMesas = () => {
    const mesaActual = tables.find(
      (t) => `Mesa ${t.name} (${t.type})` === pedido.mesa
    )
    return (
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>UNIR MESAS</span>
          <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
        </div>

        <div className={styles.divider} />

        <h3 className={styles.currentItemsTitle}>PRODUCTOS DEL PEDIDO ACTUAL</h3>
        <div className={styles.productosScroll}>
          {pedido.items.map((item, i) => (
            <div key={i} className={styles.productoRow}>
              <div className={styles.productoInfo}>
                <span className={styles.productoName}>{item.nombre}</span>
                <span className={styles.productoUnitDetail}>
                  ${formatPrecio(item.precioUnitario)} c/u &times; {item.cantidad}
                </span>
              </div>
              <span className={styles.productoSubtotal}>${formatPrecio(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className={styles.divider} />

        <p className={styles.unirDescripcion}>
          Seleccione una mesa para fusionar su pedido con la {pedido.mesa}.
        </p>

        <div className={styles.unirGrid}>
          {tables.map((t) => {
            const esActual = mesaActual?.id === t.id
            const disp = mesaDisponible(t)
            const tienePedido = mesaTienePedido(t.name, t.type)
            const seleccionada = mesaSeleccionada === t.id
            const deshabilitada = esActual || !disp || !tienePedido
            return (
              <div
                key={t.id}
                className={`${styles.unirCard} ${seleccionada ? styles.unirCardSel : ''} ${deshabilitada ? styles.unirCardDisabled : ''}`}
                onClick={() => {
                  if (deshabilitada) return
                  setMesaSeleccionada(seleccionada ? null : t.id)
                }}
              >
                <span className={styles.unirCardName}>Mesa {t.name} ({t.type})</span>
                <div className={styles.unirCardInfo}>
                  {esActual ? (
                    <span className={styles.unirCardEstadoActual}>Mesa actual</span>
                  ) : !tienePedido ? (
                    <span className={styles.unirCardEstadoSin}>Sin pedido</span>
                  ) : (
                    <span className={styles.unirCardEstado}>{getEstadoMesa(t)}</span>
                  )}
                  {t.status === 'RESERVADA' && t.reservation?.hora && !esActual && (
                    <span className={styles.unirCardReserva}>{formatearHora(t.reservation.hora)}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderCambiarMesa = () => {
    const mesasLibres = tables.filter(
      (t) =>
        t.status === 'VACÍA' &&
        !t.reservation &&
        `Mesa ${t.name} (${t.type})` !== pedido.mesa
    )
    return (
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>CAMBIAR MESA</span>
          <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
        </div>

        <div className={styles.divider} />

        <p className={styles.unirDescripcion}>
          Seleccione una mesa libre para mover el pedido de la {pedido.mesa}.
        </p>

        {mesasLibres.length === 0 ? (
          <p className={styles.emptyText}>No hay mesas libres disponibles</p>
        ) : (
          <div className={styles.unirGrid}>
            {mesasLibres.map((t) => {
              const seleccionada = mesaSeleccionada === t.id
              return (
                <div
                  key={t.id}
                  className={`${styles.unirCard} ${seleccionada ? styles.unirCardSel : ''}`}
                  onClick={() => setMesaSeleccionada(seleccionada ? null : t.id)}
                >
                  <span className={styles.unirCardName}>Mesa {t.name} ({t.type})</span>
                  <span className={styles.unirCardEstado}>Libre</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const renderAbonarDinero = () => {
    const historialAbonos = pedidoActual.abonos ?? []
    return (
      <div className={styles.editPanel}>
        <div className={styles.editHeader}>
          <span className={styles.editHeaderTitle}>ABONAR DINERO</span>
          <button className={styles.editVolverBtn} onClick={volverAcciones}>VOLVER</button>
        </div>

        <div className={styles.divider} />

        <div className={styles.abonoTotalRow}>
          <span className={styles.abonoLabel}>TOTAL CUENTA</span>
          <span className={styles.abonoTotal}>${formatPrecio(totalCuenta)}</span>
        </div>

        <div className={styles.abonoSaldoRow}>
          <span className={styles.abonoLabel}>ABONADO</span>
          <span className={styles.abonoAbonado}>${formatPrecio(totalAbonado)}</span>
        </div>

        <div className={styles.divider} />

        <label className={styles.abonoInputLabel}>MONTO ABONADO ($)</label>
        <input
          className={styles.abonoInput}
          type="number"
          min="0"
          step="any"
          placeholder="0"
          value={montoAbono}
          onChange={(e) => setMontoAbono(e.target.value)}
        />

        {excedeSaldo && (
          <p className={styles.abonoError}>
            El monto abonado no puede superar el saldo pendiente.
          </p>
        )}

        <div className={styles.divider} />

        <div className={styles.abonoResultadosFinal}>
          <h3 className={styles.currentItemsTitle}>SALDO PENDIENTE</h3>
          <span className={styles.abonoSaldoGrande}>
            ${formatPrecio(saldoPendiente)}
          </span>
        </div>

        {historialAbonos.length > 0 && (
          <>
            <div className={styles.abonoHistorialBlock}>
              <h3 className={styles.currentItemsTitle}>ABONOS REALIZADOS</h3>
              <div className={styles.abonoHistorial}>
                {historialAbonos.map((a, i) => (
                  <div key={i} className={styles.abonoHistItem}>
                    <span className={styles.abonoHistHora}>{a.hora}</span>
                    <span className={styles.abonoHistMetodo}>{a.metodo}</span>
                    <span className={styles.abonoHistMonto}>${formatPrecio(a.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  const renderConfirmFusion = () => {
    if (!showFusionConfirm || !mesaSeleccionada) return null
    const target = tables.find((t) => t.id === mesaSeleccionada)
    if (!target) return null
    return (
      <div className={styles.confirmOverlay} onClick={() => setShowFusionConfirm(false)}>
        <div className={styles.confirmModalFusion} onClick={(e) => e.stopPropagation()}>
          <h3 className={styles.confirmTitleFusion}>¿Fusionar mesas?</h3>
          <p className={styles.confirmTextFusion}>
            ¿Desea pasar todos los productos de Mesa {target.name} ({target.type}) a la {pedido.mesa}?
            <br /><br />
            Los productos con el mismo nombre se sumarán en una sola línea. La mesa de origen quedará libre.
          </p>
          <div className={styles.confirmActionsFusion}>
            <button className={styles.confirmNoFusion} onClick={() => setShowFusionConfirm(false)}>Cancelar</button>
            <button className={styles.confirmYesFusion} onClick={ejecutarFusion}>Fusionar</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaCircle}>{mesaNum || pedido.turno}</div>
            <div>
              <h2 className={styles.headerTitle}>MESA {pedido.mesa.replace(/[^0-9]/g, '') || pedido.mesa} • DETALLES</h2>
              <p className={styles.headerSubtitle}>Comanda #{pedido.id}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoRow}>
            <div>
              <div className={styles.infoLabel}>HORA COMANDA</div>
              <div className={styles.infoValue}>{pedido.horaCreacion}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>MESERO ATIENDE</div>
              <div className={styles.infoValue}>{pedido.mesero || '—'}</div>
            </div>
          </div>

          {modo === 'acciones' && (
            <>
              <h3 className={styles.sectionTitle}>PRODUCTOS SOLICITADOS</h3>
              <div className={styles.divider} />

              <div className={styles.productosScroll}>
                {pedido.items.map((item, i) => (
                  <div key={i} className={styles.productoRow}>
                    <div className={styles.productoInfo}>
                      <span className={styles.productoName}>{item.nombre}</span>
                      <span className={styles.productoUnitDetail}>
                        ${formatPrecio(item.precioUnitario)} c/u &times; {item.cantidad}
                      </span>
                    </div>
                    <span className={styles.productoSubtotal}>${formatPrecio(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.divider} />
            </>
          )}

          {modo === 'acciones' && renderAcciones()}
          {modo === 'agregar-quitar' && renderAgregarQuitar()}
          {modo === 'separar-cuenta' && renderSepararCuenta()}
          {modo === 'unir-mesas' && renderUnirMesas()}
          {modo === 'cambiar-mesa' && renderCambiarMesa()}
          {modo === 'abonar-dinero' && renderAbonarDinero()}
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
              <button className={styles.btnConfirmar} disabled={!hayMovimientos} onClick={confirmarSeparar}>
                CONFIRMAR DIVISIÓN
              </button>
            </>
          ) : modo === 'unir-mesas' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada} onClick={() => setShowFusionConfirm(true)}>
                FUSIONAR MESAS
              </button>
            </>
          ) : modo === 'cambiar-mesa' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada} onClick={ejecutarCambioMesa}>
                CAMBIAR MESA
              </button>
            </>
          ) : modo === 'abonar-dinero' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!montoValido} onClick={ejecutarAbono}>
                CONFIRMAR ABONO
              </button>
            </>
          ) : (
            <>
              <div className={styles.footerLeft} />
              <button className={styles.btnCerrar} onClick={onClose}>CERRAR DETALLES</button>
            </>
          )}
        </div>

        {renderConfirmFusion()}
      </div>
    </div>
  )
}

export default DetallePedidoModal

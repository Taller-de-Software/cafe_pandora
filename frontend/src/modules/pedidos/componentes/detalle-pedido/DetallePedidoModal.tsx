import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pedido, EstadoPedido } from '../../data/pedidos'
import type { Subcategoria } from '@modules/menu/api/subcategorias'
import type { Producto } from '@modules/menu/api/productos'
import {
  listarMesas,
  cambiarEstado,
  actualizarItemsPedido,
  separarCuentaPedido,
  unirMesasPedido,
  cambiarMesaPedido,
  registrarAbonoPedido,
  listarMetodosPago,
} from '../../data/pedidos'
import { listarCategorias } from '@modules/menu/api/categorias'
import { listarSubcategorias } from '@modules/menu/api/subcategorias'
import { listarProductos } from '@modules/menu/api/productos'
import { formatPrecio } from '../../utils/pedido-helpers'
import { getMesaNumero, getMesaNombre, getComandaId, getHoraComanda, getMesero, getProductos } from '../../utils/pedido-helpers'
import { useError } from '@/context/ErrorContext'

import VistaAgregarQuitar from './VistaAgregarQuitar'
import VistaSepararCuenta from './VistaSepararCuenta'
import VistaUnirMesas from './VistaUnirMesas'
import VistaCambiarMesa from './VistaCambiarMesa'
import VistaAbonar from './VistaAbonar'
import styles from './DetallePedidoModal.module.css'

interface DetallePedidoModalProps {
  pedido: Pedido
  onClose: () => void
}

type Modo = 'acciones' | 'agregar-quitar' | 'separar-cuenta' | 'unir-mesas' | 'cambiar-mesa' | 'abonar-dinero'

interface Accion {
  titulo: string
  descripcion: string
  icono: React.ReactNode
  onClick: () => void
}

export function DetallePedidoModal({ pedido, onClose }: DetallePedidoModalProps) {
  const { showError, showWarning, showSuccess } = useError()
  const queryClient = useQueryClient()

  const cambiarEstadoMut = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoPedido }) => cambiarEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Estado del pedido actualizado')
    },
    onError: (err) => showError(err),
  })

  const actualizarItemsMut = useMutation({
    mutationFn: ({ id, items, nuevoEstado }: { id: number; items: { productoId: number; cantidad: number }[]; nuevoEstado?: string }) =>
      actualizarItemsPedido(id, items, nuevoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Productos actualizados')
    },
    onError: (err) => showError(err),
  })

  const separarCuentaMut = useMutation({
    mutationFn: ({ id, cuentas }: { id: number; cuentas: { productoId: number; cantidad: number; precioUnitario: number }[][] }) =>
      separarCuentaPedido(id, cuentas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Cuenta separada exitosamente')
    },
    onError: (err) => showError(err),
  })

  const unirMesasMut = useMutation({
    mutationFn: ({ id, mesaOrigenId }: { id: number; mesaOrigenId: number }) => unirMesasPedido(id, mesaOrigenId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Mesas fusionadas exitosamente')
    },
    onError: (err) => showError(err),
  })

  const cambiarMesaMut = useMutation({
    mutationFn: ({ id, mesaId }: { id: number; mesaId: number }) => cambiarMesaPedido(id, mesaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Mesa cambiada exitosamente')
    },
    onError: (err) => showError(err),
  })

  const abonoMut = useMutation({
    mutationFn: ({ id, monto, metodoPagoId }: { id: number; monto: number; metodoPagoId: number }) =>
      registrarAbonoPedido(id, { monto, metodoPagoId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pedidos-activos'] })
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      queryClient.invalidateQueries({ queryKey: ['mesas'] })
      showSuccess('Abono registrado exitosamente')
    },
    onError: (err) => showError(err),
  })

  const [modo, setModo] = useState<Modo>('acciones')
  const [draftItems, setDraftItems] = useState<import('@modules/pedidos/types/tipos-comanda').ProductoRow[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null)
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [asignaciones, setAsignaciones] = useState<Record<string, number>>({})
  const [maxCuenta, setMaxCuenta] = useState(1)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<string | null>(null)
  const [montoIngresado, setMontoIngresado] = useState(0)
  const [metodoPagoAbono, setMetodoPagoAbono] = useState<number | null>(null)

  const { data: mesasDisponibles = [] } = useQuery({
    queryKey: ['mesas'],
    queryFn: listarMesas,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  })

  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])

  useEffect(() => {
    if (categoriaActiva === null) {
      setSubcategorias([])
      setSubcategoriaActiva(null)
    } else {
      listarSubcategorias(categoriaActiva).then(setSubcategorias).catch(() => setSubcategorias([]))
    }
  }, [categoriaActiva])

  const { data: catalogo = [] } = useQuery({
    queryKey: ['productos-catalogo', categoriaActiva, subcategoriaActiva],
    queryFn: () => {
      const params: { categoriaId?: number; subcategoriaId?: number } = {}
      if (categoriaActiva) params.categoriaId = categoriaActiva
      if (subcategoriaActiva) params.subcategoriaId = subcategoriaActiva
      return listarProductos(Object.keys(params).length > 0 ? params : undefined)
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: metodosPago = [] } = useQuery({
    queryKey: ['metodos-pago'],
    queryFn: listarMetodosPago,
    staleTime: 5 * 60 * 1000,
  })

  const catalogoFiltrado = useMemo(() => {
    return catalogo
      .filter((p) => p?.habilitado !== false)
      .filter((p) => !busqueda || p?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
  }, [catalogo, busqueda])

  if (!pedido) return null

  const mesaNum = getMesaNumero(pedido)
  const mesaNombre = getMesaNombre(pedido)
  const comandaId = getComandaId(pedido)
  const horaComanda = getHoraComanda(pedido)
  const mesero = getMesero(pedido)
  const productosActuales = getProductos(pedido)

  const totalAbonado = pedido.totalAbonado || 0
  const saldoPendiente = (pedido.total ?? 0) - totalAbonado

  const montoValido = montoIngresado > 0 && montoIngresado <= saldoPendiente && metodoPagoAbono !== null
  const montoError = montoIngresado > saldoPendiente ? 'El monto no puede ser mayor al saldo pendiente' : ''

  const originalStr = JSON.stringify(
    productosActuales.map((i) => ({ productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario }))
  )
  const draftStr = JSON.stringify(
    draftItems.map((i) => ({ productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario }))
  )
  const hasChanges = originalStr !== draftStr

  const obtenerColumnaDestinoEnUso = (asignaciones: Record<string, number>) => {
    const columnasUsadas = new Set(Object.values(asignaciones).filter((c) => c !== 1))
    if (columnasUsadas.size === 0) return null
    if (columnasUsadas.size === 1) return [...columnasUsadas][0]
    return null
  }

  const columnaEnUso = obtenerColumnaDestinoEnUso(asignaciones)
  const hayMovimiento = Object.values(asignaciones).some((v) => v !== 1)

  const isPending =
    actualizarItemsMut.isPending ||
    separarCuentaMut.isPending ||
    unirMesasMut.isPending ||
    cambiarMesaMut.isPending ||
    abonoMut.isPending

  const entrarAgregarQuitar = useCallback(() => {
    setDraftItems(productosActuales.map((i) => ({ ...i })))
    setCategoriaActiva(null)
    setSubcategoriaActiva(null)
    setSubcategorias([])
    setBusqueda('')
    setModo('agregar-quitar')
  }, [productosActuales])

  const volverAcciones = useCallback(() => {
    setDraftItems([])
    setAsignaciones({})
    setMaxCuenta(1)
    setMesaSeleccionada(null)
    setMontoIngresado(0)
    setMetodoPagoAbono(null)
    setModo('acciones')
  }, [])

  const agregarProducto = useCallback((producto: Producto) => {
    setDraftItems((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const idx = arr.findIndex((i) => i.productoId === producto.id)
      if (idx >= 0) {
        const updated = [...arr]
        const nuevaCant = updated[idx].cantidad + 1
        updated[idx] = { ...updated[idx], cantidad: nuevaCant, subtotal: nuevaCant * updated[idx].precioUnitario }
        return updated
      }
      return [
        ...arr,
        {
          nombre: producto.nombre,
          cantidad: 1,
          precioUnitario: producto.precio,
          subtotal: producto.precio,
          productoId: producto.id,
          requierePreparacion: producto.requierePreparacion,
        },
      ]
    })
  }, [])

  const quitarProducto = useCallback((nombre: string) => {
    setDraftItems((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const idx = arr.findIndex((i) => i.nombre === nombre)
      if (idx < 0) return arr
      const item = arr[idx]
      if (item.cantidad <= 1) {
        return arr.filter((i) => i.nombre !== nombre)
      }
      const updated = [...arr]
      const nuevaCant = item.cantidad - 1
      updated[idx] = { ...item, cantidad: nuevaCant, subtotal: nuevaCant * item.precioUnitario }
      return updated
    })
  }, [])

  const confirmarCambios = useCallback(() => {
    const itemsNorm = Array.isArray(draftItems) ? draftItems : []
    const items = itemsNorm
      .filter((i) => i.productoId)
      .map((i) => ({ productoId: i.productoId!, cantidad: i.cantidad }))

    const huboProductoNuevoConPreparacion = itemsNorm.some((draftItem) => {
      const original = productosActuales.find((i) => i.nombre === draftItem.nombre)
      const cantidadAgregada = (draftItem.cantidad ?? 0) - (original?.cantidad ?? 0)
      if (cantidadAgregada <= 0) return false
      return draftItem.requierePreparacion === true
    })

    const pedidoEstado = String(pedido.estado ?? '').toLowerCase()
    const nuevoEstado = pedidoEstado === 'hecho' && huboProductoNuevoConPreparacion ? 'pendiente' : undefined

    actualizarItemsMut.mutate({ id: pedido.id, items, nuevoEstado })
    setModo('acciones')
  }, [draftItems, productosActuales, actualizarItemsMut, pedido])

  const entrarSepararCuenta = useCallback(() => {
    const init: Record<string, number> = {}
    productosActuales.forEach((p) => { if (p.nombre) init[p.nombre] = 1 })
    setAsignaciones(init)
    setMaxCuenta(1)
    setModo('separar-cuenta')
  }, [productosActuales])

  const agregarCuenta = useCallback(() => {
    setMaxCuenta((prev) => prev + 1)
  }, [])

  const asignarCuenta = useCallback((nombre: string, cuenta: number) => {
    setAsignaciones((prev) => ({ ...prev, [nombre]: cuenta }))
  }, [])

  const confirmarSeparar = useCallback(() => {
    if (!hayMovimiento) return
    if (columnaEnUso === null && Object.values(asignaciones).some((v) => v !== 1)) {
      showWarning('Solo se puede dividir hacia una cuenta a la vez.')
      return
    }
    const cuentasMap: Record<number, typeof productosActuales> = {}
    for (const [nombre, cuenta] of Object.entries(asignaciones)) {
      if (!cuentasMap[cuenta]) cuentasMap[cuenta] = []
      const item = productosActuales.find((p) => p.nombre === nombre)
      if (item) {
        cuentasMap[cuenta].push(item)
      }
    }
    const itemsPorCuenta = Object.entries(cuentasMap)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, items]) =>
        items
          .filter((i) => i.productoId)
          .map((i) => ({
            productoId: i.productoId!,
            cantidad: i.cantidad,
            precioUnitario: i.precioUnitario,
          }))
      )
      .filter((cuenta) => cuenta.length > 0)

    if (itemsPorCuenta.length < 2) {
      showWarning('Debe haber al menos 2 cuentas con productos.')
      return
    }

    separarCuentaMut.mutate({ id: pedido.id, cuentas: itemsPorCuenta })
    setModo('acciones')
  }, [asignaciones, productosActuales, separarCuentaMut, pedido.id, hayMovimiento, columnaEnUso, showWarning])

  const entrarUnirMesas = useCallback(() => {
    setMesaSeleccionada(null)
    setModo('unir-mesas')
  }, [])

  const seleccionarMesa = useCallback((nombre: string) => {
    setMesaSeleccionada((prev) => (prev === nombre ? null : nombre))
  }, [])

const confirmarUnion = useCallback(() => {
    if (!mesaSeleccionada) return
    const mesa = mesasDisponibles.find((m) => m.nombre === mesaSeleccionada)
    if (!mesa) return
    unirMesasMut.mutate({ id: pedido.id, mesaOrigenId: mesa.id })
    setModo('acciones')
  }, [mesaSeleccionada, mesasDisponibles, unirMesasMut, pedido.id])

  const otrasMesas = mesasDisponibles.filter((m) => m.nombre !== mesaNombre)

  const entrarAbonarDinero = useCallback(() => {
    setMontoIngresado(0)
    setMetodoPagoAbono(metodosPago.length > 0 ? metodosPago[0].id : null)
    setModo('abonar-dinero')
  }, [metodosPago])

  const confirmarAbono = useCallback(() => {
    if (!montoValido || !metodoPagoAbono) return
    abonoMut.mutate({ id: pedido.id, monto: montoIngresado, metodoPagoId: metodoPagoAbono })
    setModo('acciones')
  }, [montoValido, metodoPagoAbono, montoIngresado, abonoMut, pedido.id])

  const entrarCambiarMesa = useCallback(() => {
    setMesaSeleccionada(null)
    setModo('cambiar-mesa')
  }, [])

  const confirmarCambioMesa = useCallback(() => {
    if (!mesaSeleccionada) return
    const mesa = mesasDisponibles.find((m) => m.nombre === mesaSeleccionada)
    if (!mesa) return
    cambiarMesaMut.mutate({ id: pedido.id, mesaId: mesa.id })
    setModo('acciones')
  }, [mesaSeleccionada, mesasDisponibles, cambiarMesaMut, pedido.id])

  const acciones: Accion[] = useMemo(
    () => [
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
        descripcion: 'Registra un pago parcial sobre el total de la cuenta.',
        icono: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: entrarAbonarDinero,
      },
    ],
    [entrarAgregarQuitar, entrarSepararCuenta, entrarUnirMesas, entrarCambiarMesa, entrarAbonarDinero]
  )

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.mesaCircle}>{mesaNum || '?'}</div>
            <div>
              <h2 className={styles.headerTitle}>MESA {mesaNombre.replace(/[^0-9]/g, '') || mesaNombre || '?'} · DETALLES</h2>
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
                {productosActuales.map((item, i) => (
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

          {modo === 'acciones' && (
            <>
              <h3 className={styles.sectionTitleGray}>ACCIONES DEL PEDIDO</h3>
              <div className={styles.divider} />

              <div className={styles.accionesGrid}>
                {acciones.map((accion, i) => (
                  <button key={i} className={styles.accionCard} onClick={accion.onClick}>
                    <div className={styles.accionIcon}>{accion.icono}</div>
                    <span className={styles.accionTitle}>{accion.titulo}</span>
                    <span className={styles.accionDesc}>{accion.descripcion}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {modo === 'agregar-quitar' && (
            <VistaAgregarQuitar
              categorias={categorias}
              catalogoFiltrado={catalogoFiltrado}
              draftItems={draftItems}
              categoriaActiva={categoriaActiva}
              subcategoriaActiva={subcategoriaActiva}
              subcategorias={subcategorias}
              busqueda={busqueda}
              onCategoriaChange={setCategoriaActiva}
              onSubcategoriaChange={setSubcategoriaActiva}
              onBusquedaChange={setBusqueda}
              onAgregarProducto={agregarProducto}
              onQuitarProducto={quitarProducto}
              onVolver={volverAcciones}
              hasChanges={hasChanges}
              isPending={isPending}
              onConfirmar={confirmarCambios}
            />
          )}

          {modo === 'separar-cuenta' && (
            <VistaSepararCuenta
              productosActuales={productosActuales}
              asignaciones={asignaciones}
              maxCuenta={maxCuenta}
              columnaEnUso={columnaEnUso}
              onAsignarCuenta={asignarCuenta}
              onAgregarCuenta={agregarCuenta}
              onVolver={volverAcciones}
              hayMovimiento={hayMovimiento}
              isPending={isPending}
              onConfirmar={confirmarSeparar}
            />
          )}

          {modo === 'unir-mesas' && (
            <VistaUnirMesas
              otrasMesas={otrasMesas}
              mesaSeleccionada={mesaSeleccionada}
              onSeleccionarMesa={seleccionarMesa}
              onVolver={volverAcciones}
              mesaNombre={mesaNombre}
              isPending={isPending}
              onConfirmar={confirmarUnion}
            />
          )}

          {modo === 'cambiar-mesa' && (
            <VistaCambiarMesa
              mesasDisponibles={mesasDisponibles}
              mesaSeleccionada={mesaSeleccionada}
              onSeleccionarMesa={seleccionarMesa}
              onVolver={volverAcciones}
              mesaNombre={mesaNombre}
              isPending={isPending}
              onConfirmar={confirmarCambioMesa}
            />
          )}

          {modo === 'abonar-dinero' && (
            <VistaAbonar
              montoIngresado={montoIngresado}
              setMontoIngresado={setMontoIngresado}
              metodoPagoAbono={metodoPagoAbono}
              setMetodoPagoAbono={setMetodoPagoAbono}
              metodosPago={metodosPago}
              totalPedido={pedido.total ?? 0}
              totalAbonado={totalAbonado}
              saldoPendiente={saldoPendiente}
              montoError={montoError}
              onConfirmar={confirmarAbono}
              onVolver={volverAcciones}
              isPending={isPending}
              disabled={!montoValido}
            />
          )}
        </div>

        <div className={styles.footer}>
          {modo === 'agregar-quitar' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!hasChanges || isPending} onClick={confirmarCambios}>
                {isPending ? 'Guardando...' : 'CONFIRMAR CAMBIOS'}
              </button>
            </>
          ) : modo === 'separar-cuenta' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!hayMovimiento || isPending} onClick={confirmarSeparar}>
                {isPending ? 'Procesando...' : 'CONFIRMAR DIVISIÓN'}
              </button>
            </>
          ) : modo === 'unir-mesas' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada || isPending} onClick={confirmarUnion}>
                {isPending ? 'Fusionando...' : 'FUSIONAR MESAS'}
              </button>
            </>
          ) : modo === 'cambiar-mesa' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!mesaSeleccionada || isPending} onClick={confirmarCambioMesa}>
                {isPending ? 'Cambiando...' : 'CAMBIAR MESA'}
              </button>
            </>
          ) : modo === 'abonar-dinero' ? (
            <>
              <div className={styles.footerLeft}>
                <button className={styles.btnVolverFooter} onClick={volverAcciones}>VOLVER</button>
              </div>
              <button className={styles.btnConfirmar} disabled={!montoValido || isPending} onClick={confirmarAbono}>
                {isPending ? 'Registrando...' : 'CONFIRMAR ABONO'}
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
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listarProductosHabilitados, listarCategorias, type ItemCarrito, type MesaCompleta } from '@modules/pedidos/data/pos'
import { crearPedido } from '@modules/pedidos/data/pedidos'
import CategoryTabs from './CategoryTabs'
import ProductSearch from './ProductSearch'
import ProductCard from './ProductCard'
import OrderSummary from './OrderSummary'
import ModalNotasPedido from './ModalNotasPedido'
import MesaGrid from './MesaGrid'
import type { Producto } from '@modules/menu/api/productos'
import { useError } from '@/context/ErrorContext'
import styles from './PosScreen.module.css'

function PosScreen() {
  const { showError, showWarning, showSuccess } = useError()
  const queryClient = useQueryClient()
  const [selectedMesa, setSelectedMesa] = useState<MesaCompleta | null>(null)
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [showNotasModal, setShowNotasModal] = useState(false)

  const { data: productos = [] } = useQuery({
    queryKey: ['productos-habilitados'],
    queryFn: listarProductosHabilitados,
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const createPedidoMut = useMutation({
    mutationFn: crearPedido,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-completas'] })
      showSuccess('Pedido creado exitosamente')
      setItems([])
      setSelectedMesa(null)
    },
    onError: showError,
  })

  const productosFiltrados = useMemo(() => {
    let filtered = productos
    if (categoriaActiva !== null) {
      filtered = filtered.filter((p) => p.categoriaId === categoriaActiva)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter((p) => p.nombre.toLowerCase().includes(q))
    }
    return filtered
  }, [productos, categoriaActiva, search])

  function addProducto(producto: Producto) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === producto.id)
      if (existing) {
        return prev.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { productoId: producto.id, producto, cantidad: 1, notas: '' }]
    })
  }

  function cambiarCantidad(productoId: number, delta: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.productoId === productoId ? { ...i, cantidad: i.cantidad + delta } : i))
        .filter((i) => i.cantidad > 0)
    )
  }

  function eliminarItem(productoId: number) {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  async function confirmarPedido() {
    if (!selectedMesa || items.length === 0) {
      showWarning('Selecciona una mesa y agrega productos al pedido.')
      return
    }
    try {
      await createPedidoMut.mutateAsync({
        mesaId: selectedMesa.id,
        items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, notas: i.notas || undefined })),
      })
    } catch {
      // Error manejado por onError en useMutation
    }
  }

  function cambiarMesa() {
    setSelectedMesa(null)
  }

  if (!selectedMesa) {
    return (
      <div className={styles.mesaSelection}>
        <MesaGrid onSelectMesa={setSelectedMesa} />
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <div className={styles.catalog}>
        <ProductSearch value={search} onChange={setSearch} />
        <CategoryTabs categorias={categorias} activa={categoriaActiva} onSelect={setCategoriaActiva} />
        <div className={styles.products}>
          {productosFiltrados.map((p) => (
            <ProductCard key={p.id} producto={p} onClick={addProducto} />
          ))}
          {productosFiltrados.length === 0 && (
            <p className={styles.noResults}>No se encontraron productos</p>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.summary}>
        <OrderSummary
          mesa={selectedMesa}
          items={items}
          onCambiarCantidad={cambiarCantidad}
          onEliminar={eliminarItem}
          onNotasClick={() => setShowNotasModal(true)}
          onConfirmar={confirmarPedido}
          onChangeMesa={cambiarMesa}
          saving={createPedidoMut.isPending}
        />
      </div>

      {showNotasModal && (
        <ModalNotasPedido
          items={items.map((i) => ({ productoId: i.productoId, nombre: i.producto.nombre, notas: i.notas }))}
          onSave={(updated) => {
            setItems((prev) =>
              prev.map((pi) => ({
                ...pi,
                notas: updated.find((u) => u.productoId === pi.productoId)?.notas ?? pi.notas,
              })),
            )
            setShowNotasModal(false)
          }}
          onClose={() => setShowNotasModal(false)}
        />
      )}
    </div>
  )
}

export default PosScreen

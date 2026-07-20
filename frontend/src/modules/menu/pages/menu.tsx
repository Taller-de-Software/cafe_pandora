import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from '@/context/ErrorContext'
import ListaCategorias from '../components/categorias/ListaCategorias'
import ListaSubcategorias from '../components/subcategorias/ListaSubcategorias'
import ListaProductos from '../components/productos/ListaProductos'
import GestionMenu from '../components/gestion/GestionMenu'
import FormularioProducto from '../components/productos/FormularioProducto'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../api/categorias'
import { listarSubcategorias, crearSubcategoria, actualizarSubcategoria, eliminarSubcategoria } from '../api/subcategorias'
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from '../api/productos'
import type { Producto } from '../api/productos'

interface GrupoProductos {
  subcategoriaId: number | null
  nombre: string
  productos: Producto[]
}
import styles from './menu.module.css'

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function Menu() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null)
  const [subcategoriaActivaId, setSubcategoriaActivaId] = useState<number | null>(null)
  const [showGestion, setShowGestion] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const { data: categorias = [], isLoading: catCargando, isError: catError } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const { data: subcategorias = [], isLoading: subCargando, isFetching: subcategoriasCargando, isError: subError } = useQuery({
    queryKey: ['subcategorias', categoriaActivaId],
    queryFn: () => listarSubcategorias(categoriaActivaId ?? undefined),
  })

  const { data: productos = [], isLoading: prodCargando, isError: prodError } = useQuery({
    queryKey: ['productos', categoriaActivaId],
    queryFn: () => listarProductos({ categoriaId: categoriaActivaId ?? undefined }),
  })

  const mostrarInhabilitados = categoriaActivaId === null && subcategoriaActivaId === null

  const termBusqueda = useMemo(() => busqueda.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), [busqueda])

  const productosBase = useMemo(() => {
    const filtro = subcategoriaActivaId
      ? productos.filter((p) => p.subcategoriaId === subcategoriaActivaId && (mostrarInhabilitados || p.habilitado !== false))
      : productos.filter((p) => mostrarInhabilitados || p.habilitado !== false)
    return filtro
  }, [productos, subcategoriaActivaId, mostrarInhabilitados])

  const productosFiltrados = useMemo(() => {
    if (!termBusqueda) return productosBase
    return productosBase.filter((p) => {
      const nombre = normalizar(p.nombre)
      const desc = normalizar(p.descripcion || '')
      const cat = normalizar(p.categoria?.nombre || '')
      const sub = normalizar(p.subcategoria?.nombre || '')
      return nombre.includes(termBusqueda) || desc.includes(termBusqueda) || cat.includes(termBusqueda) || sub.includes(termBusqueda)
    })
  }, [productosBase, termBusqueda])

  const selectedCategoria = useMemo(
    () => categorias.find((c) => c.id === categoriaActivaId),
    [categorias, categoriaActivaId]
  )
  const categoriaNombre = selectedCategoria?.nombre ?? (categoriaActivaId === null ? 'Todos los productos' : null)

  const grupos: GrupoProductos[] | null = useMemo(() => {
    if (categoriaActivaId !== null || subcategoriaActivaId !== null) return null
    const map = new Map<number | null, Producto[]>()
    for (const p of productosFiltrados) {
      const key = p.subcategoriaId ?? null
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries())
      .map(([id, prods]) => ({
        subcategoriaId: id,
        nombre: prods[0]?.subcategoria?.nombre ?? 'OTROS',
        productos: prods,
      }))
      .sort((a, b) => {
        if (a.subcategoriaId === null) return 1
        if (b.subcategoriaId === null) return -1
        return a.nombre.localeCompare(b.nombre)
      })
  }, [categoriaActivaId, subcategoriaActivaId, productosFiltrados])

  const handleSelectCategoria = useCallback((id: number | null) => {
    setCategoriaActivaId(id)
    setSubcategoriaActivaId(null)
  }, [])

  const crearCat = useMutation({
    mutationFn: crearCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      showSuccess('Categoría creada exitosamente')
    },
    onError: showError,
  })

  const actualizarCat = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      actualizarCategoria(id, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      showSuccess('Categoría actualizada exitosamente')
    },
    onError: showError,
  })

  const eliminarCat = useMutation({
    mutationFn: eliminarCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
      showSuccess('Categoría eliminada exitosamente')
    },
    onError: showError,
  })

  const crearSub = useMutation({
    mutationFn: ({ nombre, categoriaId }: { nombre: string; categoriaId: number }) =>
      crearSubcategoria({ nombre, categoriaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
      showSuccess('Subcategoría creada exitosamente')
    },
    onError: showError,
  })

  const actualizarSub = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      actualizarSubcategoria(id, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
      showSuccess('Subcategoría actualizada exitosamente')
    },
    onError: showError,
  })

  const cambiarCatSub = useMutation({
    mutationFn: ({ id, categoriaId }: { id: number; categoriaId: number }) =>
      actualizarSubcategoria(id, { categoriaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
      showSuccess('Subcategoría reasignada exitosamente')
    },
    onError: showError,
  })

  const eliminarSub = useMutation({
    mutationFn: eliminarSubcategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
      showSuccess('Subcategoría eliminada exitosamente')
    },
    onError: showError,
  })

  const crearProd = useMutation({
    mutationFn: crearProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', categoriaActivaId] })
      showSuccess('Producto creado exitosamente')
    },
    onError: showError,
  })

  const actualizarProd = useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      actualizarProducto(id, formData),
    onSuccess: () => {
      setShowProdForm(false)
      setProductoEditando(null)
      queryClient.invalidateQueries({ queryKey: ['productos', categoriaActivaId] })
      showSuccess('Producto actualizado exitosamente')
    },
    onError: showError,
  })

  const eliminarProd = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', categoriaActivaId] })
      showSuccess('Producto eliminado exitosamente')
    },
    onError: showError,
  })

  const abrirFormProducto = useCallback((producto: Producto) => {
    setProductoEditando(producto)
    setShowProdForm(true)
  }, [])

  const handleEliminarProducto = useCallback(async (id: number) => {
    try {
      await eliminarProd.mutateAsync(id)
    } catch {
      // Error manejado por onError en useMutation
    }
  }, [eliminarProd])

  if (catCargando) return <div className={styles.layout}><p>Cargando categorías...</p></div>
  if (catError) return <div className={styles.layout}><p>Error al cargar categorías</p></div>

  return (
    <div className={styles.layout}>
      <div className={styles.banner}>
        <div className={styles.bannerIcono}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l1.5 5.5L19 6.5l-4 4.5 2 6.5-5-3.5L7 17.5l2-6.5-4-4.5 5.5 1z"/>
          </svg>
        </div>
        <div className={styles.bannerTexto}>
          <h2>MENÚ</h2>
          <p>Accede a los servicios de menú de Cafe Pandora</p>
        </div>
      </div>
      <div className={styles.tarjetaFiltros}>
        <div className={styles.bloqueFiltro}>
          <label className={styles.seccionLabel}>Categorías</label>
          <ListaCategorias
            categorias={categorias}
            categoriaActivaId={categoriaActivaId}
            onSeleccionar={handleSelectCategoria}
          />
        </div>
        <div className={styles.bloqueFiltro}>
          <label className={styles.seccionLabel}>Subcategorías</label>
          {subCargando && <p>Cargando...</p>}
          {subError && <p>Error al cargar subcategorías</p>}
          {!subCargando && !subError && (
            <ListaSubcategorias
              subcategorias={subcategorias}
              subcategoriaActivaId={subcategoriaActivaId}
              onSeleccionar={setSubcategoriaActivaId}
            />
          )}
        </div>
      </div>

      <div className={styles.seccionProductos}>
        {prodCargando && <p>Cargando productos...</p>}
        {prodError && <p>Error al cargar productos</p>}
          {!prodCargando && !prodError && (
          <ListaProductos
            productos={productosFiltrados}
            grupos={grupos}
            categoriaNombre={categoriaNombre}
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            onGestionar={() => setShowGestion(true)}
            onEditar={abrirFormProducto}
            onEliminar={handleEliminarProducto}
          />
        )}
      </div>

      {showGestion && (
        <GestionMenu
          categorias={categorias}
          subcategorias={subcategorias}
          subcategoriasCargando={subcategoriasCargando}
          onCrearCat={async (nombre) => { await crearCat.mutateAsync({ nombre }) }}
          onActualizarCat={async (id, nombre) => { await actualizarCat.mutateAsync({ id, nombre }) }}
          onEliminarCat={async (id) => { await eliminarCat.mutateAsync(id) }}
          onCrearSub={async (nombre, categoriaId) => { await crearSub.mutateAsync({ nombre, categoriaId }) }}
          onActualizarSub={async (id, nombre) => { await actualizarSub.mutateAsync({ id, nombre }) }}
          onEliminarSub={async (id) => { await eliminarSub.mutateAsync(id) }}
          onCambiarCatSub={async (id, categoriaId) => { await cambiarCatSub.mutateAsync({ id, categoriaId }) }}
          onCrearProd={async (formData) => { await crearProd.mutateAsync(formData) }}
          onCerrar={() => setShowGestion(false)}
        />
      )}

      {showProdForm && productoEditando && (
        <FormularioProducto
          producto={productoEditando}
          categorias={categorias}
          subcategorias={subcategorias}
          subcategoriasCargando={subcategoriasCargando}
          onGuardar={async (formData) => {
            await actualizarProd.mutateAsync({ id: productoEditando.id, formData })
          }}
          onCerrar={() => {
            setShowProdForm(false)
            setProductoEditando(null)
          }}
        />
      )}
    </div>
  )
}

export default Menu

import { useState } from 'react'
import { Link } from 'react-router-dom'
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

function Menu() {
  const { showError } = useError()
  const queryClient = useQueryClient()

  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null)
  const [subcategoriaActivaId, setSubcategoriaActivaId] = useState<number | null>(null)
  const [showGestion, setShowGestion] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)

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
  const productosFiltrados = subcategoriaActivaId
    ? productos.filter((p) => p.subcategoriaId === subcategoriaActivaId && (mostrarInhabilitados || p.habilitado !== false))
    : productos.filter((p) => mostrarInhabilitados || p.habilitado !== false)

  const selectedCategoria = categorias.find((c) => c.id === categoriaActivaId)
  const categoriaNombre = selectedCategoria?.nombre ?? (categoriaActivaId === null ? 'Todos los productos' : null)

  const grupos: GrupoProductos[] | null =
    categoriaActivaId === null && subcategoriaActivaId === null
      ? (() => {
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
        })()
      : null

  function handleSelectCategoria(id: number | null) {
    setCategoriaActivaId(id)
    setSubcategoriaActivaId(null)
  }

  const crearCat = useMutation({
    mutationFn: crearCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
    onError: showError,
  })

  const actualizarCat = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      actualizarCategoria(id, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
    onError: showError,
  })

  const eliminarCat = useMutation({
    mutationFn: eliminarCategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
    onError: showError,
  })

  const crearSub = useMutation({
    mutationFn: ({ nombre, categoriaId }: { nombre: string; categoriaId: number }) =>
      crearSubcategoria({ nombre, categoriaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
    },
    onError: showError,
  })

  const actualizarSub = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) =>
      actualizarSubcategoria(id, { nombre }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
    },
    onError: showError,
  })

  const cambiarCatSub = useMutation({
    mutationFn: ({ id, categoriaId }: { id: number; categoriaId: number }) =>
      actualizarSubcategoria(id, { categoriaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
    },
    onError: showError,
  })

  const eliminarSub = useMutation({
    mutationFn: eliminarSubcategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategorias', categoriaActivaId] })
    },
    onError: showError,
  })

  const crearProd = useMutation({
    mutationFn: crearProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', categoriaActivaId] })
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
    },
    onError: showError,
  })

  const eliminarProd = useMutation({
    mutationFn: eliminarProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos', categoriaActivaId] })
    },
    onError: showError,
  })

  function abrirFormProducto(producto: Producto) {
    setProductoEditando(producto)
    setShowProdForm(true)
  }

  if (catCargando) return <div className={styles.layout}><p>Cargando categorías...</p></div>
  if (catError) return <div className={styles.layout}><p>Error al cargar categorías</p></div>

  async function handleEliminarProducto(id: number) {
    try {
      await eliminarProd.mutateAsync(id)
    } catch {
      // Error manejado por onError en useMutation
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.breadcrumb}>
        <Link to="/dashboard" className={styles.breadcrumbLink}>← Volver al Inicio</Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>MENÚ</span>
      </div>
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

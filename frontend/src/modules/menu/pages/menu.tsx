import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useError } from '@/context/ErrorContext'
import ListaCategorias from '../components/categorias/ListaCategorias'
import ListaSubcategorias from '../components/subcategorias/ListaSubcategorias'
import ListaProductos from '../components/productos/ListaProductos'
import FormularioCategoria from '../components/categorias/FormularioCategoria'
import FormularioSubcategoria from '../components/subcategorias/FormularioSubcategoria'
import FormularioProducto from '../components/productos/FormularioProducto'
import { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } from '../api/categorias'
import { listarSubcategorias, crearSubcategoria, actualizarSubcategoria, eliminarSubcategoria } from '../api/subcategorias'
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from '../api/productos'
import type { Producto } from '../api/productos'
import styles from './menu.module.css'

function Menu() {
  const { showError } = useError()
  const queryClient = useQueryClient()

  const [categoriaActivaId, setCategoriaActivaId] = useState<number | null>(null)
  const [subcategoriaActivaId, setSubcategoriaActivaId] = useState<number | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)
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
      setShowProdForm(false)
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

  function abrirFormProducto(producto?: Producto) {
    setProductoEditando(producto ?? null)
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
      <div className={styles.seccion}>
        <label className={styles.seccionLabel}>Categorías</label>
        <ListaCategorias
          categorias={categorias}
          categoriaActivaId={categoriaActivaId}
          onSeleccionar={handleSelectCategoria}
          onAbrirFormulario={() => setShowCatForm(true)}
        />
      </div>

      <div className={styles.seccion}>
        <label className={styles.seccionLabel}>Subcategorías</label>
        {subCargando && <p>Cargando...</p>}
        {subError && <p>Error al cargar subcategorías</p>}
        {!subCargando && !subError && (
          <ListaSubcategorias
            subcategorias={subcategorias}
            subcategoriaActivaId={subcategoriaActivaId}
            onSeleccionar={setSubcategoriaActivaId}
            onAbrirFormulario={() => setShowSubForm(true)}
          />
        )}
      </div>

      <div className={styles.seccionProductos}>
        {prodCargando && <p>Cargando productos...</p>}
        {prodError && <p>Error al cargar productos</p>}
        {!prodCargando && !prodError && (
          <ListaProductos
            productos={productosFiltrados}
            categoriaNombre={categoriaNombre}
            onAgregar={() => abrirFormProducto()}
            onEditar={abrirFormProducto}
            onEliminar={handleEliminarProducto}
          />
        )}
      </div>

      {showCatForm && (
        <FormularioCategoria
          categorias={categorias}
          onCrear={async (nombre) => { await crearCat.mutateAsync({ nombre }) }}
          onActualizar={async (id, nombre) => { await actualizarCat.mutateAsync({ id, nombre }) }}
          onEliminar={async (id) => { await eliminarCat.mutateAsync(id) }}
          onCerrar={() => setShowCatForm(false)}
        />
      )}

      {showSubForm && (
        <FormularioSubcategoria
          subcategorias={subcategorias}
          categorias={categorias}
          onCrear={async (nombre, catId) => { await crearSub.mutateAsync({ nombre, categoriaId: catId }) }}
          onActualizar={async (id, nombre) => { await actualizarSub.mutateAsync({ id, nombre }) }}
          onEliminar={async (id) => { await eliminarSub.mutateAsync(id) }}
          onCambiarCategoria={async (id, catId) => { await cambiarCatSub.mutateAsync({ id, categoriaId: catId }) }}
          onCerrar={() => setShowSubForm(false)}
        />
      )}

      {showProdForm && (
        <FormularioProducto
          producto={productoEditando}
          categorias={categorias}
          subcategorias={subcategorias}
          subcategoriasCargando={subcategoriasCargando}
          onGuardar={async (formData) => {
            if (productoEditando) {
              await actualizarProd.mutateAsync({ id: productoEditando.id, formData })
            } else {
              await crearProd.mutateAsync(formData)
            }
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

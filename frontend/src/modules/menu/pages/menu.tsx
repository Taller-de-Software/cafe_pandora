import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ListaCategorias from '../componentes/ListaCategorias'
import FormularioCategoria from '../componentes/FormularioCategoria'
import ListaProductos from '../componentes/ListaProductos'
import FormularioProducto from '../componentes/FormularioProducto'
import { listarCategorias, crearCategoria, eliminarCategoria } from '../data/categorias'
import { listarProductos, crearProducto } from '../data/productos'
import styles from './menu.module.css'

function Menu() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
  })

  const { data: productos = [] } = useQuery({
    queryKey: ['productos', selectedId],
    queryFn: () => listarProductos(selectedId!),
    enabled: selectedId != null,
  })

  const crearCat = useMutation({
    mutationFn: crearCategoria,
    onSuccess: () => {
      setShowCatForm(false)
      queryClient.invalidateQueries({ queryKey: ['categorias'] })
    },
  })

  const eliminarCat = useMutation({
    mutationFn: eliminarCategoria,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })

  const crearProd = useMutation({
    mutationFn: (data: { nombre: string; precio: number; descripcion?: string; requierePreparacion: boolean }) =>
      crearProducto({ ...data, categoriaId: selectedId! }),
    onSuccess: () => {
      setShowProdForm(false)
      queryClient.invalidateQueries({ queryKey: ['productos', selectedId] })
    },
  })

  const selectedCategoria = categorias.find((c) => c.id === selectedId)

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <ListaCategorias
          categorias={categorias}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDelete={(id) => { if (selectedId === id) setSelectedId(null); eliminarCat.mutate(id) }}
          onAdd={() => setShowCatForm(true)}
        />
      </div>
      <div className={styles.main}>
        <ListaProductos
          productos={selectedId != null ? productos : []}
          categoriaNombre={selectedCategoria?.nombre ?? null}
          onAdd={() => setShowProdForm(true)}
        />
      </div>

      {showCatForm && (
        <FormularioCategoria
          onSave={async (nombre) => { await crearCat.mutateAsync({ nombre }) }}
          onCancel={() => setShowCatForm(false)}
        />
      )}
      {showProdForm && selectedId && (
        <FormularioProducto
          onSave={async (data) => { await crearProd.mutateAsync(data) }}
          onCancel={() => setShowProdForm(false)}
        />
      )}
    </div>
  )
}

export default Menu

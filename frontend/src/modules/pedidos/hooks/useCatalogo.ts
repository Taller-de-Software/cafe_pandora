import { useQuery } from '@tanstack/react-query'
import { listarCategorias } from '../../menu/api/categorias'
import { listarSubcategorias } from '../../menu/api/subcategorias'
import { listarProductos } from '../../menu/api/productos'
import type { Categoria } from '../../menu/api/categorias'
import type { Subcategoria } from '../../menu/api/subcategorias'
import type { Producto } from '../../menu/api/productos'

interface UseCatalogoOptions {
  categoriaActivaId: number | null
  subcategoriaActivaId: number | null
  busqueda: string
}

export function useCatalogo({ categoriaActivaId, subcategoriaActivaId, busqueda }: UseCatalogoOptions) {
  const { data: categorias = [], isLoading: categoriasLoading } = useQuery({
    queryKey: ['categorias'],
    queryFn: listarCategorias,
    staleTime: 5 * 60 * 1000,
  })

  const { data: subcategorias = [], isLoading: subcategoriasLoading } = useQuery({
    queryKey: ['subcategorias', categoriaActivaId],
    queryFn: () => listarSubcategorias(categoriaActivaId ?? undefined),
    enabled: !!categoriaActivaId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: productos = [], isLoading: productosLoading } = useQuery({
    queryKey: ['productos', categoriaActivaId, subcategoriaActivaId],
    queryFn: () => {
      const params: { categoriaId?: number; subcategoriaId?: number } = {}
      if (categoriaActivaId) params.categoriaId = categoriaActivaId
      if (subcategoriaActivaId) params.subcategoriaId = subcategoriaActivaId
      return listarProductos(Object.keys(params).length > 0 ? params : undefined)
    },
    staleTime: 5 * 60 * 1000,
  })

  const catalogoFiltrado = productos
    .filter((p) => p?.habilitado !== false)
    .filter((p) => !busqueda || p?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))

  return {
    categorias,
    subcategorias,
    productos: catalogoFiltrado,
    loading: categoriasLoading || subcategoriasLoading || productosLoading,
  }
}
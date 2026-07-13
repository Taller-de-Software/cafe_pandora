import type { Producto } from '@modules/menu/api/productos'
import { formatearNumero } from '@/utils/formatear'
import { getApiUrl } from '@/services/server-config'
import styles from './ProductCard.module.css'

const BASE = getApiUrl().replace('/api', '')

function imagenUrlCompleta(imagenUrl?: string): string | null {
  if (!imagenUrl) return null
  if (imagenUrl.startsWith('http')) return imagenUrl
  return `${BASE}/${imagenUrl.replace(/^\//, '')}`
}

interface ProductCardProps {
  producto: Producto
  onClick: (producto: Producto) => void
}

function ProductCard({ producto, onClick }: ProductCardProps) {
  const imgSrc = imagenUrlCompleta(producto.imagenUrl)

  return (
    <div className={styles.card} onClick={() => onClick(producto)}>
      {imgSrc ? (
        <img className={styles.img} src={imgSrc} alt={producto.nombre} />
      ) : (
        <div className={styles.noImg}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}
      <div className={styles.body}>
        <span className={styles.nombre}>{producto.nombre}</span>
        {producto.descripcion && <span className={styles.desc}>{producto.descripcion.slice(0, 60)}</span>}
        <span className={styles.precio}>${formatearNumero(producto.precio)}</span>
      </div>
    </div>
  )
}

export default ProductCard

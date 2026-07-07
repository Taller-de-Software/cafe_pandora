import type { Producto } from '../../menu/api/productos'
import { formatearNumero } from '@/utils/formatear'
import styles from './TarjetaProductoPedido.module.css'

interface TarjetaProductoPedidoProps {
  producto: Producto
  onClick?: () => void
}

function TarjetaProductoPedido({ producto, onClick }: TarjetaProductoPedidoProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <span className={styles.name}>{producto.nombre}</span>
      {producto.descripcion && (
        <span className={styles.description}>{producto.descripcion}</span>
      )}
      <span className={styles.price}>${formatearNumero(producto.precio)}</span>
    </div>
  )
}

export default TarjetaProductoPedido

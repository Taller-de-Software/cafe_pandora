import type { ItemCarrito } from '@modules/pedidos/data/pos'
import { formatearNumero } from '@/utils/formatear'
import styles from './OrderItem.module.css'

interface OrderItemProps {
  item: ItemCarrito
  onCambiarCantidad: (id: number, delta: number) => void
  onEliminar: (id: number) => void
}

function OrderItem({ item, onCambiarCantidad, onEliminar }: OrderItemProps) {
  const subtotal = item.producto.precio * item.cantidad

  return (
    <div className={styles.item}>
      <div className={styles.header}>
        <span className={styles.nombre}>{item.producto.nombre}</span>
        <button className={styles.removeBtn} onClick={() => onEliminar(item.productoId)}>×</button>
      </div>
      <div className={styles.controls}>
        <button className={styles.qtyBtn} onClick={() => onCambiarCantidad(item.productoId, -1)} disabled={item.cantidad <= 1}>−</button>
        <span className={styles.cantidad}>{item.cantidad}</span>
        <button className={styles.qtyBtn} onClick={() => onCambiarCantidad(item.productoId, 1)}>+</button>
        <span className={styles.subtotal}>${formatearNumero(subtotal)}</span>
      </div>
      {item.notas && <span className={styles.notas}>{item.notas}</span>}
    </div>
  )
}

export default OrderItem

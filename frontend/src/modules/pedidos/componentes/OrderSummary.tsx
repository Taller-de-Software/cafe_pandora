import type { ItemCarrito, MesaCompleta } from '@modules/pedidos/data/pos'
import { formatearNumero } from '@/utils/formatear'
import OrderItem from './OrderItem'
import styles from './OrderSummary.module.css'

interface OrderSummaryProps {
  mesa: MesaCompleta
  items: ItemCarrito[]
  onCambiarCantidad: (productoId: number, delta: number) => void
  onEliminar: (productoId: number) => void
  nombreCliente: string
  onNombreClienteChange: (value: string) => void
  onNotasClick?: () => void
  onConfirmar: () => void
  onChangeMesa: () => void
  saving: boolean
}

function OrderSummary({ mesa, items, onCambiarCantidad, onEliminar, nombreCliente, onNombreClienteChange, onNotasClick, onConfirmar, onChangeMesa, saving }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  const total = subtotal

  return (
    <div className={styles.panel}>
      <div className={styles.mesaInfo}>
        <div>
          <strong>{mesa.nombre}</strong>
          <span className={styles.zona}>{mesa.ubicacion}</span>
        </div>
        <button className={styles.changeBtn} onClick={onChangeMesa}>Cambiar Mesa</button>
      </div>

      <div className={styles.items}>
        {items.length === 0 ? (
          <p className={styles.empty}>Selecciona productos para agregar a la comanda</p>
        ) : (
          items.map((item) => (
            <OrderItem
              key={item.productoId}
              item={item}
              onCambiarCantidad={onCambiarCantidad}
              onEliminar={onEliminar}
            />
          ))
        )}
      </div>

      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>${formatearNumero(subtotal)}</span>
        </div>
        <div className={`${styles.totalRow} ${styles.totalFinal}`}>
          <span>Total</span>
          <span>${formatearNumero(total)}</span>
        </div>
      </div>

      <input
        className={styles.clienteInput}
        type="text"
        placeholder="Nombre del cliente"
        value={nombreCliente}
        onChange={(e) => onNombreClienteChange(e.target.value)}
      />
      {onNotasClick && (
        <button
          className={styles.notasBtn}
          onClick={onNotasClick}
          disabled={items.length === 0}
        >
          📝 Añadir Notas
        </button>
      )}
      <button
        className={styles.confirmBtn}
        onClick={onConfirmar}
        disabled={items.length === 0 || saving || !nombreCliente.trim()}
      >
        {saving ? 'Confirmando...' : 'Confirmar Pedido'}
      </button>
    </div>
  )
}

export default OrderSummary

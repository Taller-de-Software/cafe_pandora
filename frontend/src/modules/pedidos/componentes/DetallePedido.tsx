import type { Pedido, EstadoPedido } from '../data/pedidos'
import { cambiarEstado } from '../data/pedidos'
import { formatearNumero } from '@/utils/formatear'
import styles from './DetallePedido.module.css'

interface DetallePedidoProps {
  pedido: Pedido
  onUpdate: () => void
}

const transiciones: Record<EstadoPedido, EstadoPedido[]> = {
  recibido: ['pendiente', 'cancelado'],
  pendiente: ['hecho', 'cancelado'],
  hecho: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: [],
}

const badgeColor: Record<EstadoPedido, string> = {
  recibido: styles.recibido,
  pendiente: styles.pendiente,
  hecho: styles.hecho,
  finalizado: styles.hecho,
  cancelado: styles.cancel,
}

async function handleCambiarEstado(id: number, estado: EstadoPedido, onUpdate: () => void) {
  try {
    await cambiarEstado(id, estado)
    onUpdate()
  } catch {
    alert('Error al cambiar el estado del pedido')
  }
}

function DetallePedido({ pedido, onUpdate }: DetallePedidoProps) {
  const disponibles = transiciones[pedido.estado] ?? []

  return (
    <div className={styles.aside}>
      <div className={styles.header}>
        <h3>{pedido.mesa.nombre} · Turno #{pedido.turno}</h3>
        <span className={`${styles.badge} ${badgeColor[pedido.estado]}`}>
          {pedido.estado}
        </span>
      </div>

      <div className={styles.meta}>
        <span>Creado: {new Date(pedido.creadoEn).toLocaleString()}</span>
      </div>

      <div className={styles.items}>
        <h4>Productos</h4>
        {pedido.detalles.map((d) => (
          <div key={d.id} className={styles.item}>
            <div>
              <span className={styles.itemName}>{d.producto.nombre}</span>
              <span className={styles.itemQty}>x{d.cantidad}</span>
            </div>
            <span className={styles.itemPrice}>
              ${formatearNumero(d.precioUnitario * d.cantidad)}
            </span>
          </div>
        ))}
      </div>

      {pedido.total != null && (
        <div className={styles.totalSection}>
          <span>Total</span>
          <span>${formatearNumero(pedido.total)}</span>
        </div>
      )}

      {disponibles.length > 0 && (
        <div className={styles.actions}>
          {disponibles.map((est) => (
            <button
              key={est}
              className={`${styles.actionBtn} ${badgeColor[est]}`}
              onClick={() => handleCambiarEstado(pedido.id, est, onUpdate)}
            >
              {est === 'cancelado' ? 'Cancelar' : `→ ${est}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default DetallePedido

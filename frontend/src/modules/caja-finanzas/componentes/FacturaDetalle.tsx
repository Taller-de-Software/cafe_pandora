import type { ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './FacturaDetalle.module.css'

interface FacturaDetalleProps {
  factura: ResumenFactura
  onClose: () => void
}

function FacturaDetalle({ factura, onClose }: FacturaDetalleProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.brand}>Café Pandora</h3>
          <p className={styles.invoiceNum}>Factura #{factura.id}</p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.meta}>
          <span>Mesa: {factura.pedido.mesa}</span>
          <span>{new Date(factura.creadoEn).toLocaleString()}</span>
        </div>

        <hr className={styles.divider} />

        <ul className={styles.items}>
          {factura.pedido.detalles.map((d, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.itemName}>
                {d.cantidad}x {d.producto}
              </span>
              <span className={styles.itemPrice}>
                ${formatearNumero(d.precio * d.cantidad)}
              </span>
            </li>
          ))}
        </ul>

        <div className={styles.totals}>
          <div className={styles.row}>
            <span>Subtotal</span>
            <span>${formatearNumero(factura.subtotal)}</span>
          </div>
          <div className={styles.row}>
            <span>Impuesto Consumo (8%)</span>
            <span>${formatearNumero(factura.impuestoConsumo)}</span>
          </div>
          <div className={`${styles.row} ${styles.total}`}>
            <span>Total</span>
            <span>${formatearNumero(factura.total)}</span>
          </div>
        </div>

        <div className={styles.payment}>
          <span>Método de Pago</span>
          <span>{factura.metodoPago}</span>
        </div>

        <div className={styles.actions}>
          <button className={styles.closeBtn} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  )
}

export default FacturaDetalle

import { Receipt } from 'lucide-react'
import type { ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './ListaFacturas.module.css'

interface ListaFacturasProps {
  facturas: ResumenFactura[]
  onSelect: (factura: ResumenFactura) => void
}

function ListaFacturas({ facturas, onSelect }: ListaFacturasProps) {
  return (
    <div className={styles.card}>
      <h3>Ventas</h3>

      {facturas.length === 0 ? (
        <p className={styles.empty}>Sin ventas registradas</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Mesa</th>
              <th>Total</th>
              <th>Método</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr key={f.id} className={styles.clickable} onClick={() => onSelect(f)}>
                <td className={styles.monoCell}>#{f.pedido.id}</td>
                <td>{f.pedido.mesa}</td>
                <td className={styles.monoCell}>${formatearNumero(f.total)}</td>
                <td>{f.metodoPago}</td>
                <td className={styles.dateCell}>{new Date(f.creadoEn).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default ListaFacturas

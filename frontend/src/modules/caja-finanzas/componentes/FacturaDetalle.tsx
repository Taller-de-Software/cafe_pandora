import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { ResumenFactura } from '../data/caja'
import { obtenerComprobante, comprobanteDisponible } from '../../pedidos/data/facturas'
import { formatearNumero } from '@/utils/formatear'
import { useError } from '@/context/ErrorContext'
import styles from './FacturaDetalle.module.css'

interface FacturaDetalleProps {
  factura: ResumenFactura
  onClose: () => void
}

function FacturaDetalle({ factura, onClose }: FacturaDetalleProps) {
  const { showError, showSuccess } = useError()
  const [printing, setPrinting] = useState(false)
  const [disponible, setDisponible] = useState(true)

  useEffect(() => {
    comprobanteDisponible(factura.id).then((res) => {
      setDisponible(res.disponible)
    }).catch(() => setDisponible(false))
  }, [factura.id])

  async function handlePrint() {
    setPrinting(true)
    try {
      const result = await obtenerComprobante(factura.id)
      if (result.pdfUrl) {
        window.open(result.pdfUrl, '_blank')
      } else if (result.message) {
        showSuccess(result.message)
      }
    } catch (err) {
      showError(err)
    } finally {
      setPrinting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.overlay}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.headerGradient}>
            <h3 className={styles.brand}>Café Pandora</h3>
            <p className={styles.invoiceNum}>Factura #{factura.id}</p>
          </div>

          <div className={styles.body}>
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
              <div className={styles.row}>
                <span>Propina (10%)</span>
                <span>${formatearNumero(factura.propina)}</span>
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
          </div>

          <div className={styles.actions}>
            <button className={styles.closeBtn} onClick={onClose}>Cerrar</button>
            <button className={styles.printBtn} onClick={handlePrint} disabled={printing || !disponible} title={!disponible ? 'Comprobante no disponible' : 'Imprimir'}>
              {printing ? 'Imprimiendo...' : !disponible ? 'N/D' : 'Imprimir'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FacturaDetalle

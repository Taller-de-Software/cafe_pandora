import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { ResumenFactura, Retiro } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './ListaMovimientos.module.css'

interface ListaMovimientosProps {
  facturas: ResumenFactura[]
  retiros: Retiro[]
  onAddEntrada: () => void
  onAddSalida: () => void
  onSelectFactura: (factura: ResumenFactura) => void
}

type MovimientoUnificado = {
  id: string
  tipo: 'venta' | 'entrada' | 'salida'
  monto: number
  fecha: string
  metodoPago?: string
  mesa?: string
  factura?: ResumenFactura
}

function ListaMovimientos({ facturas, retiros, onAddEntrada, onAddSalida, onSelectFactura }: ListaMovimientosProps) {
  const [selected, setSelected] = useState<MovimientoUnificado | null>(null)

  const movimientos = useMemo(() => {
    const items: MovimientoUnificado[] = []

    facturas.forEach((f) => {
      items.push({
        id: `venta-${f.id}`,
        tipo: 'venta',
        monto: f.total,
        fecha: f.creadoEn,
        metodoPago: f.metodoPago,
        mesa: f.pedido.mesa,
        factura: f,
      })
    })

    retiros.forEach((r) => {
      items.push({
        id: `retiro-${r.id}`,
        tipo: r.tipo,
        monto: r.monto,
        fecha: r.retiradoEn,
      })
    })

    items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    return items
  }, [facturas, retiros])

  function handleClick(mov: MovimientoUnificado) {
    if (mov.tipo === 'venta' && mov.factura) {
      onSelectFactura(mov.factura)
    } else {
      setSelected(mov)
    }
  }

  return (
    <>
      <div className={styles.card}>
        <h3>
          Movimientos
          <span className={styles.headerButtons}>
            <button className={styles.addBtnEntrada} onClick={onAddEntrada}>+ Entrada</button>
            <button className={styles.addBtnSalida} onClick={onAddSalida}>+ Retiro</button>
          </span>
        </h3>

        {movimientos.length === 0 ? (
          <p className={styles.empty}>Sin movimientos registrados</p>
        ) : (
          <div className={styles.scrollContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => (
                  <tr
                    key={mov.id}
                    className={`${styles.clickable} ${mov.tipo === 'salida' ? styles.filaSalida : styles.filaEntrada}`}
                    onClick={() => handleClick(mov)}
                  >
                    <td>
                      <span className={`${styles.badge} ${
                        mov.tipo === 'venta' ? styles.badgeVenta :
                        mov.tipo === 'entrada' ? styles.badgeEntrada :
                        styles.badgeSalida
                      }`}>
                        {mov.tipo === 'venta' ? 'Venta' : mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                      </span>
                    </td>
                    <td className={`${styles.monto} ${mov.tipo === 'salida' ? styles.montoSalida : styles.montoEntrada}`}>
                      {mov.tipo === 'salida' ? '-' : '+'}${formatearNumero(mov.monto)}
                    </td>
                    <td className={styles.fecha}>{new Date(mov.fecha).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={() => setSelected(null)}
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
                <h3>Detalle del Movimiento</h3>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Tipo</span>
                  <span className={`${styles.detailValue} ${selected.tipo === 'salida' ? styles.salida : styles.entrada}`}>
                    {selected.tipo === 'venta' ? 'Venta' : selected.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Monto</span>
                  <span className={styles.detailValue}>${formatearNumero(selected.monto)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha</span>
                  <span className={styles.detailValue}>{new Date(selected.fecha).toLocaleString()}</span>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button className={styles.closeBtn} onClick={() => setSelected(null)}>Cerrar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ListaMovimientos

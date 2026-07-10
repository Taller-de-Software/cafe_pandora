import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import type { Retiro } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './ListaRetiros.module.css'

interface ListaRetirosProps {
  retiros: Retiro[]
  onAdd: () => void
}

function ListaRetiros({ retiros, onAdd }: ListaRetirosProps) {
  const [selected, setSelected] = useState<Retiro | null>(null)

  return (
    <>
      <div className={styles.card}>
        <h3>
          Retiros
          <button className={styles.addBtn} onClick={onAdd}>+ Nuevo</button>
        </h3>

        {retiros.length === 0 ? (
          <p className={styles.empty}>Sin movimientos</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {retiros.map((r) => (
                <tr key={r.id} className={styles.clickable} onClick={() => setSelected(r)}>
                  <td>
                    <span className={`${styles.badge} ${r.tipo === 'entrada' ? styles.badgeExito : styles.badgePeligro}`}>
                      {r.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                  <td className={styles.monto}>${formatearNumero(r.monto)}</td>
                  <td className={styles.fecha}>{new Date(r.retiradoEn).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <span className={`${styles.detailValue} ${selected.tipo === 'entrada' ? styles.entrada : styles.salida}`}>
                    {selected.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Monto</span>
                  <span className={styles.detailValue}>${formatearNumero(selected.monto)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fecha</span>
                  <span className={styles.detailValue}>{new Date(selected.retiradoEn).toLocaleString()}</span>
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

export default ListaRetiros

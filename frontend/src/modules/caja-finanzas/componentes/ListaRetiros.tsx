import { useState } from 'react'
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
                  <td className={r.tipo === 'entrada' ? styles.entrada : styles.salida}>
                    {r.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                  </td>
                  <td>${formatearNumero(r.monto)}</td>
                  <td>{new Date(r.retiradoEn).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Detalle del Movimiento</h3>
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
            <button className={styles.closeBtn} onClick={() => setSelected(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  )
}

export default ListaRetiros

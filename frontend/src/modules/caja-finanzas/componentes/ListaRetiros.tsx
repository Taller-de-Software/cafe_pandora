import type { Retiro } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import styles from './ListaRetiros.module.css'

interface ListaRetirosProps {
  retiros: Retiro[]
  onAdd: () => void
}

function ListaRetiros({ retiros, onAdd }: ListaRetirosProps) {
  return (
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
              <tr key={r.id}>
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
  )
}

export default ListaRetiros

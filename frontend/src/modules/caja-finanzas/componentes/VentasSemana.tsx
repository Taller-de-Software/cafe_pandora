import { useQuery } from '@tanstack/react-query'
import { obtenerVentasSemana } from '../data/ventas'
import { formatearNumero } from '@/utils/formatear'
import styles from './Ventas.module.css'

function VentasSemana() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ventas', 'semana'],
    queryFn: obtenerVentasSemana,
  })

  if (isLoading) return <div className={styles.card}>Cargando ventas semanales...</div>
  if (isError || !data) return <div className={styles.card}>Error al cargar ventas semanales</div>

  const { resumen, pedidos } = data

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Ventas Semanales</h3>
        <span className={styles.date}>Semana actual</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>${formatearNumero(resumen.total)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pedidos</span>
          <span className={styles.statValue}>{resumen.cantidadPedidos}</span>
        </div>
      </div>

      {pedidos.length === 0 ? (
        <p className={styles.empty}>Sin ventas esta semana</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Mesa</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td>{p.mesa}</td>
                  <td>${formatearNumero(p.total)}</td>
                  <td>{new Date(p.creadoEn).toLocaleDateString()}</td>
                  <td><span className={styles.badge}>{p.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default VentasSemana

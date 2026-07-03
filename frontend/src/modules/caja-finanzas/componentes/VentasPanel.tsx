import { useQuery } from '@tanstack/react-query'
import { obtenerVentasDia, obtenerVentasSemana, obtenerVentasMes } from '../data/ventas'
import type { VentasResponse } from '../data/ventas'
import { formatearNumero } from '@/utils/formatear'
import styles from './VentasPanel.module.css'

type Periodo = 'dia' | 'semana' | 'mes'

const queries: Record<Periodo, { key: string[]; fn: () => Promise<VentasResponse>; titulo: string; subtitulo: string }> = {
  dia: {
    key: ['ventas', 'dia'],
    fn: obtenerVentasDia,
    titulo: 'Ventas del Día',
    subtitulo: new Date().toLocaleDateString(),
  },
  semana: {
    key: ['ventas', 'semana'],
    fn: obtenerVentasSemana,
    titulo: 'Ventas Semanales',
    subtitulo: 'Semana actual',
  },
  mes: {
    key: ['ventas', 'mes'],
    fn: obtenerVentasMes,
    titulo: 'Ventas Mensuales',
    subtitulo: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  },
}

function VentasPanel({ periodo }: { periodo: Periodo }) {
  const cfg = queries[periodo]
  const { data, isLoading, isError } = useQuery({
    queryKey: cfg.key,
    queryFn: cfg.fn,
  })

  if (isLoading) {
    return <div className={styles.card}>Cargando {cfg.titulo.toLowerCase()}...</div>
  }

  if (isError || !data) {
    return <div className={styles.card}>Error al cargar {cfg.titulo.toLowerCase()}</div>
  }

  const { resumen, porCategoria, productosMasVendidos, pedidos } = data
  const hayVentas = pedidos.length > 0

  return (
    <div className={styles.layout}>
      {/* Header */}
      <div className={styles.header}>
        <h3>{cfg.titulo}</h3>
        <span className={styles.date}>{cfg.subtitulo}</span>
      </div>

      {/* Stats Cards */}
      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Ventas</span>
          <span className={styles.statValue}>${formatearNumero(resumen.total)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Pedidos</span>
          <span className={styles.statValue}>{resumen.cantidadPedidos}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Ticket Promedio</span>
          <span className={styles.statValue}>${formatearNumero(resumen.ticketPromedio)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Items Vendidos</span>
          <span className={styles.statValue}>{resumen.itemsVendidos}</span>
        </div>
      </div>

      {/* Categories + Top Products */}
      <div className={styles.split}>
        {/* Ventas por Categoría */}
        <div className={styles.card}>
          <h4 className={styles.sectionTitle}>Ventas por Categoría</h4>
          {!hayVentas || porCategoria.length === 0 ? (
            <p className={styles.empty}>No hay datos de categorías en este período</p>
          ) : (
            <table className={styles.tableCompact}>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {porCategoria.map((cat) => (
                  <tr key={cat.categoria}>
                    <td>{cat.categoria}</td>
                    <td>{cat.cantidad}</td>
                    <td>${formatearNumero(cat.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Productos Más Vendidos */}
        <div className={styles.card}>
          <h4 className={styles.sectionTitle}>Productos Más Vendidos</h4>
          {!hayVentas || productosMasVendidos.length === 0 ? (
            <p className={styles.empty}>No hay datos de productos en este período</p>
          ) : (
            <table className={styles.tableCompact}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {productosMasVendidos.map((p) => (
                  <tr key={p.producto}>
                    <td>{p.producto}</td>
                    <td>{p.cantidad}</td>
                    <td>${formatearNumero(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pedidos Table */}
      <div className={styles.card}>
        <h4 className={styles.sectionTitle}>Pedidos</h4>
        {!hayVentas ? (
          <p className={styles.empty}>Sin ventas en este período</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Mesa</th>
                  <th>Total</th>
                  <th>Método Pago</th>
                  <th>{periodo === 'dia' ? 'Hora' : 'Fecha'}</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.mesa}</td>
                    <td>${formatearNumero(p.total)}</td>
                    <td>{p.metodoPago}</td>
                    <td>
                      {periodo === 'dia'
                        ? new Date(p.creadoEn).toLocaleTimeString()
                        : new Date(p.creadoEn).toLocaleDateString()}
                    </td>
                    <td><span className={styles.badge}>{p.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VentasPanel

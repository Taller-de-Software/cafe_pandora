import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { TrendingUp, ShoppingCart, DollarSign, Package, BarChart3 } from 'lucide-react'
import { obtenerVentasDia, obtenerVentasSemana, obtenerVentasMes } from '../data/ventas'
import type { VentaDetalle, VentasResponse } from '../data/ventas'
import type { ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import FacturaDetalle from './FacturaDetalle'
import styles from './VentasPanel.module.css'

type Periodo = 'dia' | 'semana' | 'mes'

const QUERIES: Record<Periodo, { key: string[]; fn: () => Promise<VentasResponse>; titulo: string }> = {
  dia: {
    key: ['ventas', 'dia'],
    fn: obtenerVentasDia,
    titulo: 'Ventas del Día',
  },
  semana: {
    key: ['ventas', 'semana'],
    fn: obtenerVentasSemana,
    titulo: 'Ventas Semanales',
  },
  mes: {
    key: ['ventas', 'mes'],
    fn: obtenerVentasMes,
    titulo: 'Ventas Mensuales',
  },
}

function getSubtitulo(periodo: Periodo): string {
  if (periodo === 'dia') return new Date().toLocaleDateString()
  if (periodo === 'semana') return 'Semana actual'
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
}

const CATEGORY_COLORS: Record<string, string> = {
  'Comidas': '#D4A574',
  'Bebidas Calientes': '#8BAA7A',
  'Gaseosas': '#B8A0C8',
  'Bebidas Frias': '#9AB0C0',
  'Postres': '#C49A5E',
}

function VentasPanel({ periodo }: { periodo: Periodo }) {
  const cfg = QUERIES[periodo]
  const subtitulo = getSubtitulo(periodo)
  const { data, isLoading, isError } = useQuery({
    queryKey: cfg.key,
    queryFn: cfg.fn,
    refetchInterval: 30_000,
  })

  const [selectedDetalle, setSelectedDetalle] = useState<ResumenFactura | null>(null)

  if (isLoading) {
    return <div className={styles.card}>Cargando {cfg.titulo.toLowerCase()}...</div>
  }

  if (isError || !data) {
    return <div className={styles.card}>Error al cargar {cfg.titulo.toLowerCase()}</div>
  }

  const { resumen, porCategoria, productosMasVendidos, pedidos } = data
  const hayVentas = pedidos.length > 0

  const ventasPorMetodoPago = pedidos.reduce<Record<string, number>>((acc, p) => {
    acc[p.metodoPago] = (acc[p.metodoPago] ?? 0) + p.total
    return acc
  }, {})

  const maxCatTotal = Math.max(...porCategoria.map((c) => c.total), 1)

  function facturaDesdeVenta(p: VentaDetalle): ResumenFactura {
    const subtotal = p.detalles.reduce((s, d) => s + d.precio * d.cantidad, 0)
    return {
      id: p.id,
      total: p.total,
      subtotal,
      impuestoConsumo: p.total - subtotal,
      creadoEn: p.creadoEn,
      metodoPago: p.metodoPago,
      pedido: {
        id: p.id,
        mesa: p.mesa,
        estado: p.estado,
        detalles: p.detalles,
      },
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <h3>{cfg.titulo}</h3>
        <span className={styles.date}>{subtitulo}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={`${styles.statIcon} ${styles.statIconExito}`}>
            <DollarSign size={16} />
          </div>
          <span className={styles.statLabel}>Total Ventas</span>
          <span className={`${styles.statValue} ${styles.statValueExito}`}>${formatearNumero(resumen.total)}</span>
          <span className={styles.statSub}>
            {periodo === 'dia' ? 'Hoy' : periodo === 'semana' ? 'Esta semana' : 'Este mes'}
          </span>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statIcon} ${styles.statIconOro}`}>
            <ShoppingCart size={16} />
          </div>
          <span className={styles.statLabel}>Pedidos</span>
          <span className={`${styles.statValue} ${styles.statValueOro}`}>{resumen.cantidadPedidos}</span>
          <span className={styles.statSub}>Completados</span>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statIcon} ${styles.statIconOro}`}>
            <TrendingUp size={16} />
          </div>
          <span className={styles.statLabel}>Ticket Promedio</span>
          <span className={`${styles.statValue} ${styles.statValueOro}`}>${formatearNumero(resumen.ticketPromedio)}</span>
          <span className={styles.statSub}>Por pedido</span>
        </div>
        <div className={styles.stat}>
          <div className={`${styles.statIcon} ${styles.statIconExito}`}>
            <Package size={16} />
          </div>
          <span className={styles.statLabel}>Items Vendidos</span>
          <span className={`${styles.statValue} ${styles.statValueExito}`}>{resumen.itemsVendidos}</span>
          <span className={styles.statSub}>Total</span>
        </div>
      </div>

      <div className={styles.split}>
        <div className={styles.card}>
          <h4 className={styles.sectionTitle}>Ventas por Categoría</h4>
          {!hayVentas || porCategoria.length === 0 ? (
            <p className={styles.empty}>No hay datos de categorías en este período</p>
          ) : (
            <div className={styles.categoryBars}>
              {porCategoria.map((cat) => {
                const pct = (cat.total / maxCatTotal) * 100
                const color = CATEGORY_COLORS[cat.categoria] || '#9B9792'
                return (
                  <div key={cat.categoria} className={styles.categoryRow}>
                    <div className={styles.categoryHeader}>
                      <span className={styles.categoryName}>{cat.categoria}</span>
                      <span className={styles.categoryValue}>${formatearNumero(cat.total)}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={styles.barFill}
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h4 className={styles.sectionTitle}>Productos Más Vendidos</h4>
          {!hayVentas || productosMasVendidos.length === 0 ? (
            <p className={styles.empty}>No hay datos de productos en este período</p>
          ) : (
            <div className={styles.topProducts}>
              {productosMasVendidos.slice(0, 5).map((p, i) => (
                <div key={p.producto} className={styles.productRow}>
                  <span className={`${styles.rankBadge} ${i === 0 ? styles.rankGold : i === 1 ? styles.rankSilver : styles.rankDefault}`}>
                    {i + 1}
                  </span>
                  <div className={styles.productInfo}>
                    <span className={styles.productName}>{p.producto}</span>
                    <span className={styles.productQty}>{p.cantidad} vendidos</span>
                  </div>
                  <span className={styles.productRevenue}>${formatearNumero(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h4 className={styles.sectionTitle}>Ventas por Método de Pago</h4>
          {!hayVentas || Object.keys(ventasPorMetodoPago).length === 0 ? (
            <p className={styles.empty}>Sin ventas en este período</p>
          ) : (
            Object.entries(ventasPorMetodoPago).map(([metodo, total]) => (
              <div key={metodo} className={styles.metodoCard}>
                <span className={styles.metodoNombre}>{metodo}</span>
                <span className={styles.metodoMonto}>${formatearNumero(total)}</span>
              </div>
            ))
          )}
        </div>
      </div>

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
                  <tr key={p.id} className={styles.clickable} onClick={() => setSelectedDetalle(facturaDesdeVenta(p))}>
                    <td className={styles.monoCell}>#{p.id}</td>
                    <td>{p.mesa}</td>
                    <td className={styles.monoCell}>${formatearNumero(p.total)}</td>
                    <td>{p.metodoPago}</td>
                    <td className={styles.dateCell}>
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

      <div className={styles.summaryBar}>
        <div className={styles.summaryIcon}>
          <BarChart3 size={18} color="#7A3E1D" />
        </div>
        <div>
          <span className={styles.summaryLabel}>Resumen</span>
          <span className={styles.summaryText}>
            {resumen.cantidadPedidos === 0
              ? 'No hay actividad registrada.'
              : `${resumen.cantidadPedidos} pedido${resumen.cantidadPedidos !== 1 ? 's' : ''} completado${resumen.cantidadPedidos !== 1 ? 's' : ''} con ${resumen.itemsVendidos} item${resumen.itemsVendidos !== 1 ? 's' : ''} vendido${resumen.itemsVendidos !== 1 ? 's' : ''}.`}
          </span>
        </div>
      </div>

      {selectedDetalle && (
        <FacturaDetalle factura={selectedDetalle} onClose={() => setSelectedDetalle(null)} />
      )}
    </div>
  )
}

export default VentasPanel

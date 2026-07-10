import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { obtenerResumenCaja } from '../data/caja'
import type { ResumenCaja, ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import FacturaDetalle from './FacturaDetalle'
import styles from './ResumenCierre.module.css'

interface ResumenCierreProps {
  sesionId: number
  onCerrar: () => void
  onCancelar: () => void
}

function ResumenCierre({ sesionId, onCerrar, onCancelar }: ResumenCierreProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['caja', sesionId, 'resumen'],
    queryFn: () => obtenerResumenCaja(sesionId),
  })

  return (
    <div className={styles.overlay} onClick={onCancelar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Resumen del Día</h3>
          <span className={styles.date}>{new Date().toLocaleDateString()}</span>
          <span className={styles.badgeActivo}>Caja abierta</span>
        </div>

        {isLoading && <p className={styles.loading}>Cargando resumen...</p>}
        {isError && <p className={styles.error}>Error al cargar el resumen</p>}

        {data && <ResumenContent data={data} onCerrar={onCerrar} onCancelar={onCancelar} />}
      </div>
    </div>
  )
}

function ResumenContent({ data, onCerrar, onCancelar }: { data: ResumenCaja; onCerrar: () => void; onCancelar: () => void }) {
  const { sesion, resumen, facturas, retiros } = data
  const [selectedFactura, setSelectedFactura] = useState<ResumenFactura | null>(null)

  return (
    <>
      {selectedFactura && (
        <FacturaDetalle factura={selectedFactura} onClose={() => setSelectedFactura(null)} />
      )}
      <div className={styles.grid}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total Ventas</span>
          <span className={styles.statValue}>${formatearNumero(resumen.sumaTotal)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Facturas Emitidas</span>
          <span className={styles.statValue}>{resumen.cantidadFacturas}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Total en Caja</span>
          <span className={styles.statValue}>${formatearNumero(sesion.totalEnCaja)}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Balance Esperado</span>
          <span className={styles.statValue}>${formatearNumero(resumen.balanceEsperado)}</span>
        </div>
      </div>

      {/* Payment method breakdown */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Ventas por Método de Pago</h4>
        {Object.keys(resumen.desglosePorMetodoPago).length === 0 ? (
          <p className={styles.empty}>Sin ventas registradas</p>
        ) : (
          <div className={styles.metodoGrid}>
            {Object.entries(resumen.desglosePorMetodoPago).map(([metodo, info]) => (
              <div key={metodo} className={styles.metodoCard}>
                <span className={styles.metodoNombre}>{metodo}</span>
                <span className={styles.metodoMonto}>${formatearNumero(info.total)}</span>
                <span className={styles.metodoCount}>{info.count} factura{info.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retiros summary */}
      {retiros.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Retiros del Día</h4>
          <div className={styles.retiroGrid}>
            <div className={styles.retiroStat}>
              <span className={styles.retiroLabel}>Entradas</span>
              <span className={styles.retiroValor}>${formatearNumero(resumen.totalEntradasRetiros)}</span>
            </div>
            <div className={styles.retiroStat}>
              <span className={styles.retiroLabel}>Salidas</span>
              <span className={styles.retiroValor}>${formatearNumero(resumen.totalSalidasRetiros)}</span>
            </div>
          </div>
          <table className={styles.retiroTable}>
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
        </div>
      )}

      {/* Facturas table */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Facturas del Día</h4>
        {facturas.length === 0 ? (
          <p className={styles.empty}>Sin facturas registradas</p>
        ) : (
          <div className={styles.tableContainer}>
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
                  <tr key={f.id} className={styles.clickable} onClick={() => setSelectedFactura(f)}>
                    <td>#{f.pedido.id}</td>
                    <td>{f.pedido.mesa}</td>
                    <td>${formatearNumero(f.total)}</td>
                    <td>{f.metodoPago}</td>
                    <td>{new Date(f.creadoEn).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button className={styles.cancelBtn} onClick={onCancelar}>Cancelar</button>
        <button className={styles.confirmBtn} onClick={onCerrar}>
          Confirmar Cierre
        </button>
      </div>
    </>
  )
}

export default ResumenCierre

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { obtenerResumenCaja } from '../data/caja'
import type { CajaSesion, ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import FacturaDetalle from './FacturaDetalle'
import styles from './FacturacionPanel.module.css'

interface FacturacionPanelProps {
  sesion: CajaSesion | null
}

function FacturacionPanel({ sesion }: FacturacionPanelProps) {
  const [selected, setSelected] = useState<ResumenFactura | null>(null)

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['caja', sesion?.id, 'facturacion'],
    queryFn: () => obtenerResumenCaja(sesion!.id),
    enabled: !!sesion,
    refetchInterval: 15_000,
  })

  if (!sesion) {
    return <p className={styles.empty}>No hay una sesión de caja activa</p>
  }

  if (isLoading) {
    return <p className={styles.loading}>Cargando facturas...</p>
  }

  const facturas = resumen?.facturas ?? []

  return (
    <div className={styles.layout}>
      <div className={styles.header}>
        <h3>Facturación</h3>
        <span className={styles.sessionInfo}>
          Sesión #{sesion.id} · {facturas.length} factura{facturas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {facturas.length === 0 ? (
        <p className={styles.empty}>No hay facturas en esta sesión</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Factura</th>
                <th>Mesa</th>
                <th>Total</th>
                <th>Método Pago</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className={styles.clickable} onClick={() => setSelected(f)}>
                  <td>#{f.id}</td>
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

      {selected && (
        <FacturaDetalle factura={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export default FacturacionPanel

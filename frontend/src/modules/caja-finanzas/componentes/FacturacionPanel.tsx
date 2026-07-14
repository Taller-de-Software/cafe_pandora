import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { obtenerResumenCaja } from '../data/caja'
import { descargarComprobante, comprobanteDisponible } from '../../pedidos/data/facturas'
import type { CajaSesion, ResumenFactura } from '../data/caja'
import { formatearNumero } from '@/utils/formatear'
import { useError } from '@/context/ErrorContext'
import FacturaDetalle from './FacturaDetalle'
import PdfViewerModal from './PdfViewerModal'
import styles from './FacturacionPanel.module.css'

interface FacturacionPanelProps {
  sesion: CajaSesion | null
}

function FacturacionPanel({ sesion }: FacturacionPanelProps) {
  const { showError, showSuccess } = useError()
  const [selected, setSelected] = useState<ResumenFactura | null>(null)
  const [printingId, setPrintingId] = useState<number | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Record<number, boolean>>({})
  const [modoImpresion, setModoImpresion] = useState<'simulacion' | 'real'>('simulacion')
  const [pdfViewerUrl, setPdfViewerUrl] = useState<string | null>(null)

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['caja', sesion?.id, 'facturacion'],
    queryFn: () => obtenerResumenCaja(sesion!.id),
    enabled: !!sesion,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    if (!resumen?.facturas.length) return
    async function checkAll() {
      try {
        const modeRes = await comprobanteDisponible(resumen.facturas[0].id)
        const modo = modeRes.modo
        setModoImpresion(modo)
        if (modo === 'real') {
          setDisponibilidad({})
          return
        }
        const results = await Promise.allSettled(
          resumen.facturas.map(f => comprobanteDisponible(f.id))
        )
        const map: Record<number, boolean> = {}
        resumen.facturas.forEach((f, i) => {
          map[f.id] = results[i].status === 'fulfilled' ? results[i].value.disponible : false
        })
        setDisponibilidad(map)
      } catch { /* ignore */ }
    }
    checkAll()
  }, [resumen?.facturas])

  async function handlePrint(e: React.MouseEvent, facturaId: number) {
    e.stopPropagation()
    setPrintingId(facturaId)
    try {
      const blobUrl = await descargarComprobante(facturaId)
      setPdfViewerUrl(blobUrl)
    } catch (err) {
      showError(err)
    } finally {
      setPrintingId(null)
    }
  }

  function handleClosePdfViewer() {
    if (pdfViewerUrl) {
      URL.revokeObjectURL(pdfViewerUrl)
    }
    setPdfViewerUrl(null)
  }

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
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => (
                <tr key={f.id} className={styles.clickable} onClick={() => setSelected(f)}>
                  <td className={styles.monoCell}>#{f.id}</td>
                  <td>{f.pedido.mesa}</td>
                  <td className={styles.monoCell}>${formatearNumero(f.total)}</td>
                  <td>{f.metodoPago}</td>
                  <td className={styles.dateCell}>{new Date(f.creadoEn).toLocaleTimeString()}</td>
                  <td>
                    <button
                      className={styles.printBtn}
                      onClick={(e) => handlePrint(e, f.id)}
                      disabled={printingId === f.id || (modoImpresion === 'simulacion' && disponibilidad[f.id] === false)}
                      title={modoImpresion === 'simulacion' && disponibilidad[f.id] === false ? 'Comprobante no disponible' : 'Imprimir'}
                    >
                      {printingId === f.id ? '...' : modoImpresion === 'simulacion' && disponibilidad[f.id] === false ? 'N/D' : 'Imprimir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <FacturaDetalle factura={selected} onClose={() => setSelected(null)} />
      )}

      {pdfViewerUrl && (
        <PdfViewerModal pdfUrl={pdfViewerUrl} onClose={handleClosePdfViewer} />
      )}
    </div>
  )
}

export default FacturacionPanel

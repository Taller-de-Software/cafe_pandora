import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './PrintModeSection.module.css'

interface ConfiguracionResponse {
  modoImpresion: 'simulacion' | 'real'
  printerEncoding?: string
  printerVendorId?: number
  printerProductId?: number
}

interface TestResult {
  success: boolean
  message: string
  simulated?: boolean
  pdfUrl?: string
  error?: string
  code?: string
}

function getPrintMode(): Promise<ConfiguracionResponse> {
  return api.get<ConfiguracionResponse>('/configuracion/impresion')
}

function setPrintMode(mode: 'simulacion' | 'real'): Promise<ConfiguracionResponse> {
  return api.put<ConfiguracionResponse>('/configuracion/impresion', { modoImpresion: mode })
}

async function testPrinter(): Promise<TestResult> {
  return api.post('/impresion/probar')
}

async function printTestReceipt(): Promise<TestResult> {
  return api.post('/diagnostico/impresora/imprimir-prueba')
}

function PrintModeSection() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['print-mode'],
    queryFn: getPrintMode,
  })

  const mode = data?.modoImpresion ?? 'simulacion'

  const mutation = useMutation({
    mutationFn: setPrintMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-mode'] })
      showSuccess('Modo de impresión actualizado')
    },
    onError: showError,
  })

  const testMutation = useMutation({
    mutationFn: testPrinter,
    onSuccess: (result) => {
      if (result.success) {
        showSuccess(result.message || (result.simulated ? 'Modo simulación activo - prueba exitosa' : 'Impresora conectada correctamente'))
      } else {
        showError(result.error || result.message || 'Error al probar la impresora')
      }
    },
    onError: showError,
  })

  const printTestMutation = useMutation({
    mutationFn: printTestReceipt,
    onSuccess: (result) => {
      if (result.success) {
        showSuccess(result.message || 'Prueba de impresión enviada')
      } else {
        showError(result.error || result.message || 'Error al imprimir prueba')
      }
    },
    onError: showError,
  })

  function handleToggle() {
    const next = mode === 'simulacion' ? 'real' : 'simulacion'
    mutation.mutate(next)
  }

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Define si las impresiones generan <strong>PDF de simulación</strong> o envían datos a una <strong>impresora térmica real</strong> por USB.
      </p>

      <div className={styles.statusCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Modo actual</span>
            <span className={`${styles.statusValue} ${mode === 'simulacion' ? styles.statusSimulate : styles.statusReal}`}>
              {mode === 'simulacion' ? 'Simulación (PDF)' : 'Impresora Real (USB)'}
            </span>
          </div>
          <div className={`${styles.indicator} ${mode === 'simulacion' ? styles.indicatorSimulate : styles.indicatorReal}`} />
        </div>

        {mode === 'real' && data && (
          <div className={styles.printerInfo}>
            {data.printerVendorId && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Vendor ID</span>
                <span className={styles.printerInfoValue}>0x{data.printerVendorId.toString(16).toUpperCase().padStart(4, '0')}</span>
              </div>
            )}
            {data.printerProductId && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Product ID</span>
                <span className={styles.printerInfoValue}>0x{data.printerProductId.toString(16).toUpperCase().padStart(4, '0')}</span>
              </div>
            )}
            {data.printerEncoding && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Encoding</span>
                <span className={styles.printerInfoValue}>{data.printerEncoding}</span>
              </div>
            )}
          </div>
        )}

          <button
            className={`${styles.toggleBtn} ${mode === 'simulacion' ? styles.toggleToReal : styles.toggleToSimulate}`}
            onClick={handleToggle}
            disabled={mutation.isPending || isLoading}
          >
            {mutation.isPending
              ? 'Cambiando...'
              : mode === 'simulacion'
                ? 'Cambiar a Impresora Real'
                : 'Cambiar a Simulación'}
          </button>
      </div>

      <div className={styles.testSection}>
        <h4 className={styles.testTitle}>Probar Impresora</h4>
        <p className={styles.testDesc}>
          Verifica la conexión con la impresora térmica. En modo simulación genera un PDF de prueba.
        </p>
        <div className={styles.testActions}>
          <button
            className={styles.testBtn}
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
          >
            {testMutation.isPending ? 'Probando...' : 'Probar Conexión'}
          </button>
          <button
            className={styles.testBtn}
            onClick={() => printTestMutation.mutate()}
            disabled={printTestMutation.isPending}
          >
            {printTestMutation.isPending ? 'Imprimiendo...' : 'Imprimir Prueba'}
          </button>
        </div>
        {testMutation.isSuccess && testMutation.data && (
          <p className={`${styles.testResult} ${testMutation.data.success ? styles.testSuccess : styles.testError}`}>
            {testMutation.data.simulated && <span className={styles.simulatedBadge}>Simulado</span>}
            {testMutation.data.success ? testMutation.data.message : (testMutation.data.error || testMutation.data.message)}
            {testMutation.data.code && !testMutation.data.success && (
              <span className={styles.errorCode}> ({testMutation.data.code})</span>
            )}
          </p>
        )}
        {printTestMutation.isSuccess && printTestMutation.data && (
          <p className={`${styles.testResult} ${printTestMutation.data.success ? styles.testSuccess : styles.testError}`}>
            {printTestMutation.data.simulated && <span className={styles.simulatedBadge}>Simulado</span>}
            {printTestMutation.data.success ? printTestMutation.data.message : (printTestMutation.data.error || printTestMutation.data.message)}
          </p>
        )}
      </div>

      <div className={styles.infoBox}>
        <span className={styles.infoTitle}>¿Qué hace cada modo?</span>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoMode}>Simulación</span>
            <span className={styles.infoDesc}>Genera un archivo PDF con el diseño del recibo. No necesita impresora conectada.</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoMode}>Impresora Real</span>
            <span className={styles.infoDesc}>Envía el comando directo a una impresora térmica SAT por USB. Requiere impresora conectada.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintModeSection

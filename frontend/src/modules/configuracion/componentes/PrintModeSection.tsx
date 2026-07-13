import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './PrintModeSection.module.css'

interface ConfiguracionResponse {
  modoImpresion: 'simulacion' | 'real'
}

function getPrintMode(): Promise<ConfiguracionResponse> {
  return api.get<ConfiguracionResponse>('/configuracion/impresion')
}

function setPrintMode(mode: 'simulacion' | 'real'): Promise<ConfiguracionResponse> {
  return api.put<ConfiguracionResponse>('/configuracion/impresion', { modoImpresion: mode })
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

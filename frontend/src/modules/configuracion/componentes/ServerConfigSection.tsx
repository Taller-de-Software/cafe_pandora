import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './ServerConfigSection.module.css'

interface ConfigGeneral {
  serverHost: string
  serverPort: number
  frontendPort: number
  corsOrigins: string
  sessionTtlMin: number
  pinMaxAttempts: number
  pinLockoutMin: number
  offlineModeEnabled: boolean
  qrCodeEnabled: boolean
}

function getConfig(): Promise<ConfigGeneral> {
  return api.get<ConfigGeneral>('/configuracion/general')
}

function saveConfig(data: Partial<ConfigGeneral>): Promise<ConfigGeneral> {
  return api.put<ConfigGeneral>('/configuracion/general', data)
}

function ServerConfigSection() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['config-general'],
    queryFn: getConfig,
  })

  const [sessionTtl, setSessionTtl] = useState('')
  const [pinMaxAttempts, setPinMaxAttempts] = useState('')
  const [pinLockoutMin, setPinLockoutMin] = useState('')
  const [offlineMode, setOfflineMode] = useState(true)
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true)
  const [corsOrigins, setCorsOrigins] = useState('')
  const [serverHost, setServerHost] = useState('')
  const [serverPort, setServerPort] = useState('')

  useEffect(() => {
    if (!config) return
    setSessionTtl(String(config.sessionTtlMin))
    setPinMaxAttempts(String(config.pinMaxAttempts))
    setPinLockoutMin(String(config.pinLockoutMin))
    setOfflineMode(config.offlineModeEnabled)
    setQrCodeEnabled(config.qrCodeEnabled)
    setCorsOrigins(config.corsOrigins)
    setServerHost(config.serverHost)
    setServerPort(String(config.serverPort))
  }, [config])

  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-general'] })
      showSuccess('Configuración guardada')
    },
    onError: showError,
  })

  function handleSaveSecurity() {
    saveMutation.mutate({
      sessionTtlMin: parseInt(sessionTtl, 10) || 600,
      pinMaxAttempts: parseInt(pinMaxAttempts, 10) || 5,
      pinLockoutMin: parseInt(pinLockoutMin, 10) || 15,
    })
  }

  function handleSaveFeatures() {
    saveMutation.mutate({
      offlineModeEnabled: offlineMode,
      qrCodeEnabled: qrCodeEnabled,
    })
  }

  function handleSaveAdvanced() {
    saveMutation.mutate({
      serverHost: serverHost || '0.0.0.0',
      serverPort: parseInt(serverPort, 10) || 3001,
      corsOrigins: corsOrigins,
    })
  }

  if (isLoading) return <p className={styles.loading}>Cargando configuración...</p>
  if (!config) return null

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Configuración general del servidor: seguridad, funciones y opciones avanzadas.
      </p>

      {/* ── Seguridad ── */}
      <div className={styles.groupCard}>
        <div className={styles.groupHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className={styles.groupTitle}>Seguridad</span>
        </div>

        <div className={styles.fieldGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sesión TTL (minutos)</label>
            <input
              className={styles.input}
              type="number"
              min={5}
              max={10080}
              value={sessionTtl}
              onChange={(e) => setSessionTtl(e.target.value)}
            />
            <span className={styles.fieldHint}>Tiempo máximo de sesión activa</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Máx. intentos PIN</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={100}
              value={pinMaxAttempts}
              onChange={(e) => setPinMaxAttempts(e.target.value)}
            />
            <span className={styles.fieldHint}>Intentos antes de bloquear</span>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Bloqueo PIN (minutos)</label>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={1440}
              value={pinLockoutMin}
              onChange={(e) => setPinLockoutMin(e.target.value)}
            />
            <span className={styles.fieldHint}>Duración del bloqueo</span>
          </div>
        </div>

        <div className={styles.saveRow}>
          <button
            className={styles.btnSave}
            onClick={handleSaveSecurity}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar Seguridad'}
          </button>
        </div>
      </div>

      {/* ── Funciones ── */}
      <div className={styles.groupCard}>
        <div className={styles.groupHeader}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className={styles.groupTitle}>Funciones</span>
        </div>

        <div className={styles.toggleList}>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Modo Offline</span>
              <span className={styles.toggleDesc}>Permitir operación sin conexión a internet</span>
            </div>
            <button
              className={`${styles.toggleSwitch} ${offlineMode ? styles.toggleActive : ''}`}
              onClick={() => setOfflineMode(!offlineMode)}
              type="button"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>

          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>Código QR</span>
              <span className={styles.toggleDesc}>Habilitar generación de códigos QR para acceso desde otros dispositivos</span>
            </div>
            <button
              className={`${styles.toggleSwitch} ${qrCodeEnabled ? styles.toggleActive : ''}`}
              onClick={() => setQrCodeEnabled(!qrCodeEnabled)}
              type="button"
            >
              <span className={styles.toggleKnob} />
            </button>
          </div>
        </div>

        <div className={styles.saveRow}>
          <button
            className={styles.btnSave}
            onClick={handleSaveFeatures}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar Funciones'}
          </button>
        </div>
      </div>

      {/* ── Avanzado (colapsable) ── */}
      <details className={styles.advancedDetails}>
        <summary className={styles.advancedSummary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          Configuración Avanzada
        </summary>
        <div className={styles.advancedContent}>
          <div className={styles.fieldGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Host del Backend</label>
              <input
                className={styles.inputMono}
                type="text"
                placeholder="0.0.0.0"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
              />
              <span className={styles.fieldHint}>Dirección de binding del servidor</span>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Puerto del Backend</label>
              <input
                className={styles.inputMono}
                type="number"
                min={1}
                max={65535}
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
              />
              <span className={styles.fieldHint}>Puerto del servidor Express</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Orígenes CORS</label>
            <textarea
              className={styles.textarea}
              placeholder="http://localhost:5173,http://localhost:3000"
              value={corsOrigins}
              onChange={(e) => setCorsOrigins(e.target.value)}
              rows={3}
            />
            <span className={styles.fieldHint}>URLs permitidas separadas por coma</span>
          </div>

          <div className={styles.saveRow}>
            <button
              className={styles.btnSave}
              onClick={handleSaveAdvanced}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Avanzado'}
            </button>
          </div>
        </div>
      </details>
    </div>
  )
}

export default ServerConfigSection

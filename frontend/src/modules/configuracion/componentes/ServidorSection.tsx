import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import QRCode from 'qrcode'
import styles from './ServidorSection.module.css'

interface NetworkInfo {
  hostname: string
  ip: string
  port: number
  url: string
  frontendPort: number
  frontendUrl: string
  interfaces: { name: string; address: string; preferred: boolean }[]
}

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

function getNetworkInfo(): Promise<NetworkInfo> {
  return api.get<NetworkInfo>('/red/network-info')
}

function getConfig(): Promise<ConfigGeneral> {
  return api.get<ConfigGeneral>('/configuracion/general')
}

function saveConfig(data: Partial<ConfigGeneral>): Promise<ConfigGeneral> {
  return api.put<ConfigGeneral>('/configuracion/general', data)
}

function saveFrontendPort(port: number): Promise<{ frontendPort: number }> {
  return api.put<{ frontendPort: number }>('/configuracion/frontend', { frontendPort: port })
}

function savePreferredInterface(name: string | null): Promise<{ preferredInterfaceName: string | null }> {
  return api.put<{ preferredInterfaceName: string | null }>('/configuracion/red/preferred-interface', { preferredInterfaceName: name })
}

function ServidorSection() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const { data: info, isLoading: infoLoading, error: infoError, refetch, isFetching } = useQuery({
    queryKey: ['network-info'],
    queryFn: getNetworkInfo,
    staleTime: 30000,
  })

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config-general'],
    queryFn: getConfig,
  })

  const [frontendPortInput, setFrontendPortInput] = useState('')
  const [sessionTtl, setSessionTtl] = useState('')
  const [pinMaxAttempts, setPinMaxAttempts] = useState('')
  const [pinLockoutMin, setPinLockoutMin] = useState('')
  const [qrCodeEnabled, setQrCodeEnabled] = useState(true)
  const [corsOrigins, setCorsOrigins] = useState('')
  const [serverHost, setServerHost] = useState('')
  const [serverPort, setServerPort] = useState('')

  useEffect(() => {
    if (info) setFrontendPortInput(String(info.frontendPort))
  }, [info])

  useEffect(() => {
    if (info?.frontendUrl && showQR) {
      QRCode.toDataURL(info.frontendUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#2D2A26', light: '#FFFFFF' },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
    }
  }, [info?.frontendUrl, showQR])

  useEffect(() => {
    if (!config) return
    setSessionTtl(String(config.sessionTtlMin))
    setPinMaxAttempts(String(config.pinMaxAttempts))
    setPinLockoutMin(String(config.pinLockoutMin))
    setQrCodeEnabled(config.qrCodeEnabled)
    setCorsOrigins(config.corsOrigins)
    setServerHost(config.serverHost)
    setServerPort(String(config.serverPort))
  }, [config])

  const portMutation = useMutation({
    mutationFn: () => saveFrontendPort(parseInt(frontendPortInput, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-info'] })
      showSuccess('Puerto del frontend actualizado')
    },
    onError: showError,
  })

  const preferredMutation = useMutation({
    mutationFn: (name: string | null) => savePreferredInterface(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-info'] })
      showSuccess('Interfaz principal actualizada')
    },
    onError: showError,
  })

  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-general'] })
      showSuccess('Configuración guardada')
    },
    onError: showError,
  })

  function copyUrl() {
    if (info?.frontendUrl) {
      navigator.clipboard.writeText(info.frontendUrl).catch(() => {})
    }
  }

  function handleRefresh() {
    refetch()
  }

  function handleSetPreferred(name: string) {
    const currentPreferred = info?.interfaces.find(i => i.preferred)?.name
    if (name === currentPreferred) return
    preferredMutation.mutate(name)
  }

  function handleSaveSecurity() {
    saveMutation.mutate({
      sessionTtlMin: parseInt(sessionTtl, 10) || 600,
      pinMaxAttempts: parseInt(pinMaxAttempts, 10) || 5,
      pinLockoutMin: parseInt(pinLockoutMin, 10) || 15,
    })
  }

  function handleSaveFeatures() {
    saveMutation.mutate({
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

  function handleSaveFrontendPort() {
    const port = parseInt(frontendPortInput, 10)
    if (port >= 1 && port <= 65535) {
      portMutation.mutate()
    }
  }

  if (infoLoading && configLoading) {
    return <p className={styles.loading}>Cargando información del servidor...</p>
  }
  if (infoError && !info) {
    return <p className={styles.error}>Error al cargar información del servidor</p>
  }

  return (
    <div className={styles.section}>
      {/* ── Información del Servidor ── */}
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Nombre del Servidor</span>
          <span className={styles.infoValue}>{info?.hostname}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>IP Local</span>
          <span className={styles.infoValueMono}>{info?.ip}</span>
        </div>
        <div className={styles.infoHighlight}>
          <span className={styles.infoLabel}>URL del Sistema</span>
          <span className={styles.infoValueUrl}>{info?.frontendUrl}</span>
        </div>
      </div>

      {/* ── Acciones ── */}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={copyUrl}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copiar URL
        </button>
        <button className={styles.btnSecondary} onClick={() => setShowQR(!showQR)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="3" height="3" />
            <line x1="21" y1="14" x2="21" y2="14.01" />
            <line x1="14" y1="21" x2="14" y2="21.01" />
            <line x1="21" y1="21" x2="21" y2="21.01" />
            <line x1="21" y1="7" x2="21" y2="7.01" />
            <line x1="7" y1="21" x2="7" y2="21.01" />
          </svg>
          {showQR ? 'Ocultar QR' : 'Compartir QR'}
        </button>
        <button className={styles.btnSecondary} onClick={handleRefresh} disabled={isFetching}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isFetching ? 'Actualizando...' : 'Refrescar'}
        </button>
      </div>

      {/* ── QR ── */}
      {showQR && qrDataUrl && info && (
        <div className={styles.qrSection}>
          <p className={styles.qrLabel}>Escanea para abrir en otro dispositivo</p>
          <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
          <p className={styles.qrUrl}>{info.frontendUrl}</p>
        </div>
      )}

      {/* ── Interfaces de Red ── */}
      {info && info.interfaces.length > 1 && (
        <div className={styles.interfacesSection}>
          <span className={styles.interfacesTitle}>Interfaces de red</span>
          <p className={styles.interfacesHint}>
            Selecciona cuál interfaz usar como principal para el servidor. La interfaz principal determina la IP que se usa para acceder al sistema desde otros dispositivos.
          </p>
          {info.interfaces.map((iface) => (
            <div key={iface.name} className={styles.interfaceItem}>
              <span className={styles.interfaceName}>{iface.name}</span>
              <span className={styles.interfaceAddr}>{iface.address}</span>
              {iface.preferred ? (
                <span className={styles.preferredBadge}>Principal</span>
              ) : (
                <button
                  className={styles.setPreferredBtn}
                  onClick={() => handleSetPreferred(iface.name)}
                  disabled={preferredMutation.isPending}
                >
                  Usar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Configuración Avanzada ── */}
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
          {/* Info del Backend */}
          {info && (
            <div className={styles.backendInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Backend URL</span>
                <span className={styles.infoValueMono}>{info.url}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Puerto Backend</span>
                <span className={styles.infoValueMono}>{info.port}</span>
              </div>
            </div>
          )}

          {/* Puerto del Frontend */}
          {info && (
            <div className={styles.portSection}>
              <span className={styles.portTitle}>Configurar URL del Sistema</span>
              <p className={styles.portHint}>
                El puerto que usan los navegadores y dispositivos para acceder al sistema.
              </p>
              <div className={styles.portRow}>
                <span className={styles.portPrefix}>{info.ip}:</span>
                <input
                  className={styles.portInput}
                  type="number"
                  min={1}
                  max={65535}
                  value={frontendPortInput}
                  onChange={(e) => setFrontendPortInput(e.target.value)}
                />
                <button
                  className={styles.portSaveBtn}
                  onClick={handleSaveFrontendPort}
                  disabled={portMutation.isPending || frontendPortInput === String(info.frontendPort)}
                >
                  {portMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {/* Host / Puerto / CORS del Backend */}
          {config && (
            <>
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
            </>
          )}

          {/* ── Seguridad ── */}
          {config && (
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
          )}

          {/* ── Funciones ── */}
          {config && (
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
          )}
        </div>
      </details>
    </div>
  )
}

export default ServidorSection

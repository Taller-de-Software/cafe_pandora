import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import QRCode from 'qrcode'
import styles from './ServerInfoSection.module.css'

interface NetworkInfo {
  hostname: string
  ip: string
  port: number
  url: string
  frontendPort: number
  frontendUrl: string
  interfaces: { name: string; address: string; preferred: boolean }[]
}

function getNetworkInfo(): Promise<NetworkInfo> {
  return api.get<NetworkInfo>('/red/network-info')
}

function saveFrontendPort(port: number): Promise<{ frontendPort: number }> {
  return api.put<{ frontendPort: number }>('/configuracion/frontend', { frontendPort: port })
}

function ServerInfoSection() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [frontendPortInput, setFrontendPortInput] = useState('')

  const { data: info, isLoading, error } = useQuery({
    queryKey: ['network-info'],
    queryFn: getNetworkInfo,
    staleTime: 30000,
  })

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

  const portMutation = useMutation({
    mutationFn: () => saveFrontendPort(parseInt(frontendPortInput, 10)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-info'] })
      showSuccess('Puerto del frontend actualizado')
    },
    onError: showError,
  })

  function copyUrl() {
    if (info?.frontendUrl) {
      navigator.clipboard.writeText(info.frontendUrl).catch(() => {})
    }
  }

  function handleSavePort() {
    const port = parseInt(frontendPortInput, 10)
    if (port >= 1 && port <= 65535) {
      portMutation.mutate()
    }
  }

  if (isLoading) return <p className={styles.loading}>Cargando información del servidor...</p>
  if (error) return <p className={styles.error}>Error al cargar información del servidor</p>
  if (!info) return null

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Información de red del servidor. Usa estos datos para que otros dispositivos accedan al sistema.
      </p>

      {/* ── Info principal: URL del frontend ── */}
      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Nombre del Servidor</span>
          <span className={styles.infoValue}>{info.hostname}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>IP Local</span>
          <span className={styles.infoValueMono}>{info.ip}</span>
        </div>
        <div className={styles.infoHighlight}>
          <span className={styles.infoLabel}>URL del Sistema</span>
          <span className={styles.infoValueUrl}>{info.frontendUrl}</span>
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
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
      </div>

      {showQR && qrDataUrl && (
        <div className={styles.qrSection}>
          <p className={styles.qrLabel}>Escanea para abrir en otro dispositivo</p>
          <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
          <p className={styles.qrUrl}>{info.frontendUrl}</p>
        </div>
      )}

      {/* ── Puerto frontend ── */}
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
            onClick={handleSavePort}
            disabled={portMutation.isPending || frontendPortInput === String(info.frontendPort)}
          >
            {portMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Info backend (colapsable) ── */}
      <details className={styles.backendDetails}>
        <summary className={styles.backendSummary}>Info del Backend (desarrolladores)</summary>
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
      </details>

      {/* ── Interfaces ── */}
      {info.interfaces.length > 1 && (
        <div className={styles.interfacesSection}>
          <span className={styles.interfacesTitle}>Interfaces de red</span>
          {info.interfaces.map((iface) => (
            <div key={iface.name} className={styles.interfaceItem}>
              <span className={styles.interfaceName}>{iface.name}</span>
              <span className={styles.interfaceAddr}>{iface.address}</span>
              {iface.preferred && <span className={styles.preferredBadge}>Principal</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ServerInfoSection

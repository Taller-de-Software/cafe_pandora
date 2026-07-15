import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import QRCode from 'qrcode'
import styles from './ServerInfoSection.module.css'

interface NetworkInfo {
  hostname: string
  ip: string
  port: number
  url: string
  interfaces: { name: string; address: string; preferred: boolean }[]
}

function ServerInfoSection() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { data: info, isLoading, error } = useQuery({
    queryKey: ['network-info'],
    queryFn: () => api.get<NetworkInfo>('/red/network-info'),
    staleTime: 30000,
  })

  useEffect(() => {
    if (info?.url && showQR) {
      QRCode.toDataURL(info.url, {
        width: 200,
        margin: 2,
        color: { dark: '#2D2A26', light: '#FFFFFF' },
      }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
    }
  }, [info?.url, showQR])

  function copyUrl() {
    if (info?.url) {
      navigator.clipboard.writeText(info.url).catch(() => {})
    }
  }

  if (isLoading) return <p className={styles.loading}>Cargando información del servidor...</p>
  if (error) return <p className={styles.error}>Error al cargar información del servidor</p>
  if (!info) return null

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Información de red del servidor. Usa estos datos para conectar otros dispositivos a la red local.
      </p>

      <div className={styles.infoCard}>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Nombre del Servidor</span>
          <span className={styles.infoValue}>{info.hostname}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>IP Local</span>
          <span className={styles.infoValueMono}>{info.ip}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Puerto</span>
          <span className={styles.infoValueMono}>{info.port}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>URL</span>
          <span className={styles.infoValueMono}>{info.url}</span>
        </div>
      </div>

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
          <p className={styles.qrLabel}>Escanea para conectar desde un móvil</p>
          <img src={qrDataUrl} alt="QR Code" className={styles.qrImage} />
          <p className={styles.qrUrl}>{info.url}</p>
        </div>
      )}

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

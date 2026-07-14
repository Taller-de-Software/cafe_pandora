import { useState, useEffect } from 'react'
import {
  getServerConfig,
  setServerConfig,
  resetServerConfig,
  isCustomConfig,
  buildServerConfig,
  testConnection,
} from '@/services/server-config'
import { reconnectSocket } from '@/services/socket'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './ServerConfigModal.module.css'

interface ServerConfigModalProps {
  onClose: () => void
  onSaved?: () => void
}

function parseUrl(url: string): { ip: string; port: string } {
  try {
    const u = new URL(url)
    return { ip: u.hostname, port: u.port || '3001' }
  } catch {
    return { ip: '', port: '3001' }
  }
}

function ServerConfigModal({ onClose, onSaved }: ServerConfigModalProps) {
  const { showError } = useError()
  const current = getServerConfig()
  const parsed = parseUrl(current.apiUrl)
  const [ip, setIp] = useState(parsed.ip)
  const [port, setPort] = useState(parsed.port)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saved, setSaved] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectedUrls, setDetectedUrls] = useState<{ interfaceName: string; interfaceAddress: string; fullUrl: string; apiUrl: string; socketUrl: string }[] | null>(null)
  const [detectError, setDetectError] = useState<string | null>(null)

  const preview = `http://${ip || '...' }:${port || '3001'}/api`
  const hasCustom = isCustomConfig()

  useEffect(() => {
    setTestResult(null)
    setSaved(false)
  }, [ip, port])

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const config = buildServerConfig(ip, port)
      const result = await testConnection(config.apiUrl)
      setTestResult(result)
    } catch (err) {
      showError(err)
      setTestResult({ ok: false, message: 'Error al probar la conexión.' })
    } finally {
      setTesting(false)
    }
  }

  async function handleAutoDetect() {
    setDetecting(true)
    setDetectError(null)
    setDetectedUrls(null)
    try {
      const result = await api.get<{ interfaceName: string; interfaceAddress: string; fullUrl: string; apiUrl: string; socketUrl: string }[]>('/red/connect-urls')
      setDetectedUrls(result)
    } catch (err) {
      setDetectError('No se pudo auto-detectar la IP. Verifica que el servidor esté accesible.')
    } finally {
      setDetecting(false)
    }
  }

  function useDetectedUrl(detected: { apiUrl: string }) {
    const p = parseUrl(detected.apiUrl)
    setIp(p.ip)
    setPort(p.port)
    setDetectedUrls(null)
    setDetectError(null)
  }

  async function handleTestPort() {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.post<{ ok: boolean }>('/red/test-port', { host: ip, port: parseInt(port) || 3001 })
      setTestResult({ ok: result.ok, message: result.ok ? 'Puerto accesible desde el servidor' : 'Puerto bloqueado o no accesible' })
    } catch (err) {
      setTestResult({ ok: false, message: 'Error al probar el puerto desde el servidor' })
    } finally {
      setTesting(false)
    }
  }

  function handleSave() {
    const config = buildServerConfig(ip, port)
    setServerConfig(config)
    reconnectSocket()
    setSaved(true)
    onSaved?.()
  }

  function handleReset() {
    resetServerConfig()
    reconnectSocket()
    const defaults = getServerConfig()
    const p = parseUrl(defaults.apiUrl)
    setIp(p.ip)
    setPort(p.port)
    setSaved(false)
    setTestResult(null)
    onSaved?.()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            </div>
            <h3 className={styles.headerTitle}>Configurar Servidor</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <p className={styles.fieldHint}>
            Configura la dirección IP del backend. En PC usa <strong>localhost</strong>. En tablet o móvil usa la IP del computador donde corre el servidor.
          </p>

          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Dirección IP</label>
              <input
                className={styles.input}
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="localhost o 192.168.1.100"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Puerto</label>
              <input
                className={`${styles.input} ${styles.portInput}`}
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="3001"
              />
            </div>
          </div>

          <div className={styles.preview}>
            <strong>URL:</strong> {preview}
          </div>

          <div className={styles.testRow}>
            <button
              className={styles.testBtn}
              onClick={handleTest}
              disabled={testing || !ip}
            >
              {testing ? 'Probando...' : 'Probar conexión (cliente)'}
            </button>
            <button
              className={styles.testBtn}
              onClick={handleTestPort}
              disabled={testing || !ip}
            >
              {testing ? 'Probando...' : 'Probar puerto (servidor)'}
            </button>
            {testResult && (
              <span className={`${styles.testResult} ${testResult.ok ? styles.testOk : styles.testError}`}>
                {testResult.ok ? '✓' : '✕'} {testResult.message}
              </span>
            )}
          </div>

          <div className={styles.detectSection}>
            <button
              className={styles.detectBtn}
              onClick={handleAutoDetect}
              disabled={detecting}
            >
              {detecting ? 'Detectando...' : 'Auto-detectar IP del servidor'}
            </button>
            {detectError && (
              <span className={styles.detectError}>{detectError}</span>
            )}
            {detectedUrls && detectedUrls.length > 0 && (
              <div className={styles.detectedUrls}>
                <strong>IPs detectadas:</strong>
                {detectedUrls.map((d) => (
                  <div key={d.interfaceName} className={styles.detectedItem}>
                    <span className={styles.detectedLabel}>{d.interfaceName} ({d.interfaceAddress})</span>
                    <button className={styles.useBtn} onClick={() => useDetectedUrl(d)}>
                      Usar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {saved && (
            <span className={`${styles.testResult} ${styles.testOk}`}>
              ✓ Configuración guardada
            </span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnReset}
            onClick={handleReset}
            disabled={!hasCustom}
          >
            Restablecer localhost
          </button>
          <button className={styles.btnPrimary} onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerConfigModal

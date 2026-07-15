import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/services/api'
import styles from './NetworkDiagnosticsSection.module.css'

interface DiagnosticoDetallado {
  timestamp: string
  totalLatencyMs: number
  servidor: {
    hostname: string
    ip: string
    port: number
    serverAccessible: boolean
  }
  api: { ok: boolean; latency: number }
  socket: { clients: number; rooms: string[] }
  baseDeDatos: { ok: boolean; latency: number }
  impresora: { connected: boolean; mode: string; error: string | null }
  red: {
    internet: boolean
    dns: boolean
    dnsLatencyMs: number | null
    gateway: string | null
    gatewayReachable: boolean
    gatewayLatencyMs: number | null
    interfaces: { name: string; address: string; preferred: boolean; reachable: boolean }[]
  }
}

interface CheckItem {
  label: string
  ok: boolean
  detail: string
  latencyMs?: number | null
}

function buildChecks(d: DiagnosticoDetallado): CheckItem[] {
  return [
    {
      label: 'Servidor encontrado',
      ok: d.servidor.serverAccessible,
      detail: d.servidor.serverAccessible
        ? `${d.servidor.ip}:${d.servidor.port}`
        : `No accesible en ${d.servidor.ip}:${d.servidor.port}`,
    },
    {
      label: 'API respondiendo',
      ok: d.api.ok,
      detail: d.api.ok ? `Latencia: ${d.api.latency}ms` : 'No responde',
      latencyMs: d.api.latency,
    },
    {
      label: 'Socket.IO',
      ok: d.socket.clients >= 0,
      detail: `${d.socket.clients} cliente(s) conectado(s)`,
    },
    {
      label: 'Base de datos',
      ok: d.baseDeDatos.ok,
      detail: d.baseDeDatos.ok ? `Latencia: ${d.baseDeDatos.latency}ms` : 'Error de conexión',
      latencyMs: d.baseDeDatos.latency,
    },
    {
      label: 'Impresora',
      ok: d.impresora.connected,
      detail: d.impresora.mode === 'simulacion'
        ? 'Modo simulación activo'
        : d.impresora.connected
          ? 'Conectada'
          : d.impresora.error || 'Sin conexión',
    },
    {
      label: 'Internet',
      ok: d.red.internet,
      detail: d.red.internet ? 'Conectado' : 'Sin acceso a Internet',
    },
    {
      label: 'DNS',
      ok: d.red.dns,
      detail: d.red.dns
        ? `Funcionando${d.red.dnsLatencyMs ? ` (${d.red.dnsLatencyMs}ms)` : ''}`
        : 'No resuelve nombres',
      latencyMs: d.red.dnsLatencyMs,
    },
    {
      label: 'Gateway',
      ok: d.red.gatewayReachable,
      detail: d.red.gateway
        ? `${d.red.gateway} (${d.red.gatewayReachable ? 'accesible' : 'no accesible'}${d.red.gatewayLatencyMs ? `, ${d.red.gatewayLatencyMs}ms` : ''})`
        : 'No detectado',
      latencyMs: d.red.gatewayLatencyMs,
    },
  ]
}

function NetworkDiagnosticsSection() {
  const [results, setResults] = useState<CheckItem[] | null>(null)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const mutation = useMutation({
    mutationFn: () => api.get<DiagnosticoDetallado>('/red/diagnostico-detallado'),
    onSuccess: (data) => {
      setResults(buildChecks(data))
      setLastCheckedAt(data.timestamp)
    },
  })

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => mutation.mutate(), 30000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  const allOk = results?.every((c) => c.ok) ?? false
  const failCount = results ? results.filter((c) => !c.ok).length : 0

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Diagnóstico completo de conectividad, servicios y hardware. Ejecuta para identificar problemas exactos.
      </p>

      <button
        className={styles.runBtn}
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <span className={styles.spinner} />
            Ejecutando diagnóstico...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Ejecutar Diagnóstico
          </>
        )}
      </button>

      {results && (
        <div className={styles.results}>
          {lastCheckedAt && (
            <div className={styles.timestamp}>
              Última verificación: {new Date(lastCheckedAt).toLocaleTimeString()}
            </div>
          )}

          <div className={`${styles.summary} ${allOk ? styles.summaryOk : styles.summaryFail}`}>
            {allOk ? 'Todos los servicios funcionan correctamente' : `${failCount} problema(s) detectado(s)`}
          </div>

          <div className={styles.checkList}>
            {results.map((check) => (
              <div key={check.label} className={`${styles.checkItem} ${check.ok ? styles.checkOk : styles.checkFail}`}>
                <span className={styles.checkIcon}>{check.ok ? '✓' : '✗'}</span>
                <div className={styles.checkInfo}>
                  <span className={styles.checkLabel}>{check.label}</span>
                  <span className={styles.checkDetail}>{check.detail}</span>
                </div>
                {check.latencyMs != null && (
                  <span className={styles.latency}>{check.latencyMs}ms</span>
                )}
              </div>
            ))}
          </div>

          <div className={styles.autoRefreshRow}>
            <label className={styles.autoRefreshLabel}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-actualizar cada 30s
            </label>
          </div>
        </div>
      )}

      {mutation.isError && (
        <div className={styles.errorBox}>
          Error al ejecutar diagnóstico. Verifica que el servidor esté accesible.
        </div>
      )}
    </div>
  )
}

export default NetworkDiagnosticsSection

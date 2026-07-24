import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './PrintModeSection.module.css'

type ConnectionType = 'windows-spooler' | 'network' | 'serial'
type Encoding = 'CP437' | 'CP850' | 'CP852' | 'CP858' | 'CP860' | 'CP863' | 'CP866' | 'CP1252' | 'CP932' | 'UTF8'

interface PrinterConfig {
  modoImpresion: 'simulacion' | 'real'
  printerName?: string
  printerConnectionType?: ConnectionType
  printerVendorId?: number
  printerProductId?: number
  printerAddress?: string
  printerNetPort?: number
  printerSerialPort?: string
  printerBaudRate?: number
  printerEncoding?: string
}

interface DetectedPrinter {
  id: string
  name: string
  connectionType: ConnectionType
  vendorId?: number
  productId?: number
  vendorIdHex?: string | null
  productIdHex?: string | null
  address?: string
  port?: number
  serialPort?: string
  compatibleMethods: ConnectionType[]
  recommendedMethod: ConnectionType
  status: string
}

interface DiagnosticsReport {
  os: string
  platform: string
  nodeVersion: string
  timestamp: string
  installedPrinters: Array<{
    name: string
    portName: string
    driverName: string
    pnpDeviceID: string
    canPrintEscPos: boolean
  }>
  serialPorts: Array<{ path: string; manufacturer?: string }>
  networkPrinters: Array<{ address: string; port: number }>
  cupsPrinters: Array<{ name: string; status: string }> | null
  recommendation: {
    method: ConnectionType | null
    device?: string
    reason: string
  }
}

interface TestResult {
  success: boolean
  message: string
  method?: string
  simulated?: boolean
  error?: string
  code?: string
  sugerencia?: string
}

const ENCODINGS: Encoding[] = ['CP437', 'CP850', 'CP852', 'CP858', 'CP860', 'CP863', 'CP866', 'CP1252', 'CP932', 'UTF8']
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

const CONNECTION_LABELS: Record<ConnectionType, string> = {
  'windows-spooler': 'Windows Print Spooler',
  'network': 'Red / Ethernet',
  'serial': 'Serial',
}

// ─── API Calls ───────────────────────────────────────────────────────────────

function getConfig(): Promise<PrinterConfig> {
  return api.get<PrinterConfig>('/configuracion/impresion/config')
}

function setPrintMode(mode: 'simulacion' | 'real'): Promise<PrinterConfig> {
  return api.put<PrinterConfig>('/configuracion/impresion', { modoImpresion: mode })
}

function getDiagnostics(): Promise<DiagnosticsReport> {
  return api.get<DiagnosticsReport>('/configuracion/impresion/diagnostics')
}

function getDetectedPrinters(): Promise<{ printers: DetectedPrinter[] }> {
  return api.get<{ printers: DetectedPrinter[] }>('/configuracion/impresion/detect')
}

function getWindowsPrinters(): Promise<{ printers: Array<{ name: string; portName: string; driverName: string }> }> {
  return api.get<{ printers: Array<{ name: string; portName: string; driverName: string }> }>('/configuracion/impresion/windows-printers')
}

function savePrinterConfig(data: Record<string, unknown>): Promise<PrinterConfig> {
  return api.put<PrinterConfig>('/configuracion/impresion/printer', data)
}

function testPrinter(): Promise<TestResult> {
  return api.post('/configuracion/impresion/test')
}

function printTestReceipt(): Promise<TestResult> {
  return api.post('/diagnostico/impresora/imprimir-prueba')
}

// ─── Component ───────────────────────────────────────────────────────────────

function PrintModeSection() {
  const { showError, showSuccess, showInfo } = useError()
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['print-mode'],
    queryFn: getConfig,
  })

  const { data: diagnostics, refetch: refetchDiagnostics } = useQuery({
    queryKey: ['printer-diagnostics'],
    queryFn: getDiagnostics,
    refetchOnWindowFocus: true,
  })

  const { data: detectedPrinters, refetch: refetchDetected } = useQuery({
    queryKey: ['detected-printers'],
    queryFn: getDetectedPrinters,
    refetchOnWindowFocus: true,
  })

  const { data: windowsPrinters } = useQuery({
    queryKey: ['windows-printers'],
    queryFn: getWindowsPrinters,
  })

  const mode = config?.modoImpresion ?? 'simulacion'

  // ── State ──
  const [selectedPrinterName, setSelectedPrinterName] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Advanced form state
  const [connectionType, setConnectionType] = useState<ConnectionType>('windows-spooler')
  const [customVendorId, setCustomVendorId] = useState('')
  const [customProductId, setCustomProductId] = useState('')
  const [networkAddress, setNetworkAddress] = useState('')
  const [networkPort, setNetworkPort] = useState('9100')
  const [serialPort, setSerialPort] = useState('')
  const [serialBaudRate, setSerialBaudRate] = useState(9600)
  const [printerName, setPrinterName] = useState('')
  const [encoding, setEncoding] = useState<string>('CP858')

  // ── Populate form from saved config ──
  useEffect(() => {
    if (!config) return
    setConnectionType((config.printerConnectionType as ConnectionType) || 'windows-spooler')
    setPrinterName(config.printerName || '')
    setSelectedPrinterName(config.printerName || '')
    setEncoding(config.printerEncoding || 'CP858')
    setNetworkPort(String(config.printerNetPort || 9100))
    setSerialBaudRate(config.printerBaudRate || 9600)

    if (config.printerVendorId && config.printerProductId) {
      setCustomVendorId(String(config.printerVendorId))
      setCustomProductId(String(config.printerProductId))
    }
    if (config.printerAddress) setNetworkAddress(config.printerAddress)
    if (config.printerSerialPort) setSerialPort(config.printerSerialPort)
  }, [config])

  // ── Mutations ──
  const modeMutation = useMutation({
    mutationFn: setPrintMode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-mode'] })
      showSuccess('Modo de impresión actualizado')
    },
    onError: showError,
  })

  const saveMutation = useMutation({
    mutationFn: savePrinterConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-mode'] })
      queryClient.invalidateQueries({ queryKey: ['printer-diagnostics'] })
      showSuccess('Configuración de impresora guardada')
    },
    onError: showError,
  })

  const testMutation = useMutation({
    mutationFn: testPrinter,
    onSuccess: (result) => {
      if (result.success) {
        showSuccess(result.message || 'Impresora conectada correctamente')
      } else {
        showError(result.message || 'Error al probar la impresora')
      }
    },
    onError: showError,
  })

  const printTestMutation = useMutation({
    mutationFn: printTestReceipt,
    onSuccess: (result) => {
      if (result.success) {
        showSuccess(result.message || 'Prueba de impresion enviada')
      } else {
        showError(result.message || 'Error al imprimir prueba')
      }
    },
    onError: showError,
  })

  // ── Handlers ──
  function handleToggle() {
    const next = mode === 'simulacion' ? 'real' : 'simulacion'
    modeMutation.mutate(next)
  }

  function handleSelectWindowsPrinter(name: string) {
    setSelectedPrinterName(name)
    setPrinterName(name)
    setConnectionType('windows-spooler')
  }

  function handleSaveFromWindows() {
    if (!selectedPrinterName) {
      showError('Seleccione una impresora de la lista')
      return
    }

    saveMutation.mutate({
      printerConnectionType: 'windows-spooler',
      printerName: selectedPrinterName,
      printerEncoding: encoding,
    })
  }

  function handleSaveAdvanced() {
    const payload: Record<string, unknown> = {
      printerConnectionType: connectionType,
      printerName: printerName || null,
      printerEncoding: encoding,
    }

    if (connectionType === 'network') {
      payload.printerAddress = networkAddress || null
      payload.printerNetPort = parseInt(networkPort, 10) || 9100
    }

    if (connectionType === 'serial') {
      payload.printerSerialPort = serialPort || null
      payload.printerBaudRate = serialBaudRate
    }

    saveMutation.mutate(payload)
  }

  if (isLoading) return <p className={styles.loading}>Cargando configuración...</p>

  const detected = detectedPrinters?.printers || []
  const winPrinters = windowsPrinters?.printers || []

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Define si las impresiones generan <strong>PDF de simulacion</strong> o envian datos a una <strong>impresora termica real</strong>.
      </p>

      {/* ── Info de impresora + Modo ── */}
      <div className={styles.statusCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Modo actual</span>
            <span className={`${styles.statusValue} ${mode === 'simulacion' ? styles.statusSimulate : styles.statusReal}`}>
              {mode === 'simulacion' ? 'Simulacion (PDF)' : 'Impresora Real'}
            </span>
          </div>
          <div className={`${styles.indicator} ${mode === 'simulacion' ? styles.indicatorSimulate : styles.indicatorReal}`} />
        </div>

        {config?.printerName && (
          <div className={styles.printerInfo}>
            <div className={styles.printerInfoRow}>
              <span className={styles.printerInfoLabel}>Nombre</span>
              <span className={styles.printerInfoValue}>{config.printerName}</span>
            </div>
            <div className={styles.printerInfoRow}>
              <span className={styles.printerInfoLabel}>Conexion</span>
              <span className={styles.printerInfoValue}>
                {CONNECTION_LABELS[(config.printerConnectionType as ConnectionType) || 'windows-spooler'] || config.printerConnectionType}
              </span>
            </div>
            {config.printerVendorId && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Vendor ID</span>
                <span className={styles.printerInfoValue}>0x{config.printerVendorId.toString(16).toUpperCase().padStart(4, '0')}</span>
              </div>
            )}
            {config.printerAddress && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Direccion</span>
                <span className={styles.printerInfoValue}>{config.printerAddress}:{config.printerNetPort || 9100}</span>
              </div>
            )}
            {config.printerSerialPort && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Puerto</span>
                <span className={styles.printerInfoValue}>{config.printerSerialPort}</span>
              </div>
            )}
            <div className={styles.printerInfoRow}>
              <span className={styles.printerInfoLabel}>Encoding</span>
              <span className={styles.printerInfoValue}>{config.printerEncoding || 'CP858'}</span>
            </div>
          </div>
        )}

        <button
          className={`${styles.toggleBtn} ${mode === 'simulacion' ? styles.toggleToReal : styles.toggleToSimulate}`}
          onClick={handleToggle}
          disabled={modeMutation.isPending}
        >
          {modeMutation.isPending
            ? 'Cambiando...'
            : mode === 'simulacion'
              ? 'Cambiar a Impresora Real'
              : 'Cambiar a Simulacion'}
        </button>
      </div>

      {/* ── Impresoras Instaladas en Windows ── */}
      <div className={styles.configCard}>
        <div className={styles.detectedHeader}>
          <h4 className={styles.configTitle} style={{ margin: 0 }}>Impresoras de Windows</h4>
          <button
            className={styles.refreshBtn}
            onClick={() => {
              refetchDiagnostics()
              refetchDetected().then(() => showInfo('Lista de impresoras actualizada'))
            }}
          >
            Actualizar
          </button>
        </div>

        {winPrinters.length === 0 ? (
          <div className={styles.connHint}>
            <p>No se detectaron impresoras instaladas en Windows. Verifique que la impresora esté conectada y con driver instalado.</p>
            {diagnostics?.recommendation && (
              <p className={styles.recommendReason}>
                Recomendacion: {diagnostics.recommendation.reason}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className={styles.radioList}>
              {winPrinters.map((p) => {
                const detectedInfo = detected.find((d) => d.name.includes(p.name) || p.name.includes(d.name || ''))
                return (
                  <label key={p.name} className={styles.radioItem}>
                    <input
                      type="radio"
                      name="windows-printer"
                      value={p.name}
                      checked={selectedPrinterName === p.name}
                      onChange={() => handleSelectWindowsPrinter(p.name)}
                    />
                    <span className={styles.radioLabel}>
                      <span className={styles.printerNameMain}>{p.name}</span>
                      <span className={styles.radioSub}>
                        {p.portName ? `Puerto: ${p.portName}` : 'Impresora local'}
                      </span>
                      {detectedInfo?.vendorIdHex && detectedInfo?.productIdHex && (
                        <span className={styles.radioSub}>
                          {detectedInfo.vendorIdHex}:{detectedInfo.productIdHex}
                        </span>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>

            <div className={styles.recommendedBox}>
              <p className={styles.recommendedText}>
                <strong>Metodo:</strong> Windows Print Spooler — imprime directamente sin programas externos.
              </p>
            </div>

            <div className={styles.configActions}>
              <button
                className={styles.btnSave}
                onClick={handleSaveFromWindows}
                disabled={!selectedPrinterName || saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Guardando...' : 'Usar esta impresora'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Probar ── */}
      <div className={styles.testSection}>
        <h4 className={styles.testTitle}>Probar Impresora</h4>
        <p className={styles.testDesc}>
          Verifica la conexion con la impresora. En modo simulacion genera un PDF de prueba.
        </p>
        <div className={styles.testActions}>
          <button className={styles.testBtn} onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
            {testMutation.isPending ? 'Probando...' : 'Probar Conexion'}
          </button>
          <button className={styles.testBtn} onClick={() => printTestMutation.mutate()} disabled={printTestMutation.isPending}>
            {printTestMutation.isPending ? 'Imprimiendo...' : 'Imprimir Prueba'}
          </button>
        </div>
        {testMutation.isSuccess && testMutation.data && (
          <p className={`${styles.testResult} ${testMutation.data.success ? styles.testSuccess : styles.testError}`}>
            {testMutation.data.success ? testMutation.data.message : (testMutation.data.message || 'Error al probar')}
            {testMutation.data.code && !testMutation.data.success && (
              <span className={styles.errorCode}> ({testMutation.data.code})</span>
            )}
            {testMutation.data.sugerencia && !testMutation.data.success && (
              <span className={styles.sugerencia}>
                {testMutation.data.sugerencia}
              </span>
            )}
          </p>
        )}
        {printTestMutation.isSuccess && printTestMutation.data && (
          <p className={`${styles.testResult} ${printTestMutation.data.success ? styles.testSuccess : styles.testError}`}>
            {printTestMutation.data.success ? printTestMutation.data.message : (printTestMutation.data.message || 'Error al imprimir')}
          </p>
        )}
      </div>

      {/* ── Configuracion Avanzada (colapsable) ── */}
      <details className={styles.advancedDetails} open={showAdvanced}>
        <summary
          className={styles.advancedSummary}
          onClick={(e) => { e.preventDefault(); setShowAdvanced(!showAdvanced) }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configuracion Avanzada (Red / Serial)
        </summary>

        {showAdvanced && (
          <div className={styles.advancedContent}>
            <p className={styles.connHint}>
              Configure manualmente solo si su impresora no aparece en la lista de Windows.
            </p>

            {/* Tabs de tipo de conexion */}
            <div className={styles.connTabs}>
              {(['network', 'serial'] as ConnectionType[]).map((t) => (
                <button
                  key={t}
                  className={`${styles.connTab} ${connectionType === t ? styles.connTabActive : ''}`}
                  onClick={() => setConnectionType(t)}
                >
                  {CONNECTION_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Network */}
            {connectionType === 'network' && (
              <div className={styles.connSection}>
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup} style={{ flex: 2 }}>
                    <label className={styles.fieldLabel}>Direccion IP</label>
                    <input className={styles.input} type="text" placeholder="192.168.1.50" value={networkAddress} onChange={(e) => setNetworkAddress(e.target.value)} />
                  </div>
                  <div className={styles.fieldGroup} style={{ flex: 1 }}>
                    <label className={styles.fieldLabel}>Puerto TCP</label>
                    <input className={styles.input} type="number" placeholder="9100" value={networkPort} onChange={(e) => setNetworkPort(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Serial */}
            {connectionType === 'serial' && (
              <div className={styles.connSection}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Puerto COM / ruta</label>
                  <input className={styles.input} type="text" placeholder="COM3 o /dev/ttyUSB0" value={serialPort} onChange={(e) => setSerialPort(e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Baud rate</label>
                  <select className={styles.select} value={serialBaudRate} onChange={(e) => setSerialBaudRate(parseInt(e.target.value, 10))}>
                    {BAUD_RATES.map((br) => (<option key={br} value={br}>{br}</option>))}
                  </select>
                </div>
              </div>
            )}

            {/* Comun */}
            <div className={styles.commonSection}>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup} style={{ flex: 2 }}>
                  <label className={styles.fieldLabel}>Nombre / Modelo</label>
                  <input className={styles.input} type="text" placeholder="SAT 22TUS" value={printerName} onChange={(e) => setPrinterName(e.target.value)} />
                </div>
                <div className={styles.fieldGroup} style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Encoding</label>
                  <select className={styles.select} value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                    {ENCODINGS.map((enc) => (<option key={enc} value={enc}>{enc}</option>))}
                  </select>
                </div>
              </div>
              {connectionType === 'windows-spooler' && (
                <div className={styles.fieldRow}>
                  <div className={styles.fieldGroup} style={{ flex: 1 }}>
                    <label className={styles.fieldLabel}>Vendor ID (hex) — opcional</label>
                    <input className={styles.inputMono} type="text" placeholder="0483" value={customVendorId} onChange={(e) => setCustomVendorId(e.target.value)} />
                  </div>
                  <div className={styles.fieldGroup} style={{ flex: 1 }}>
                    <label className={styles.fieldLabel}>Product ID (hex) — opcional</label>
                    <input className={styles.inputMono} type="text" placeholder="5743" value={customProductId} onChange={(e) => setCustomProductId(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.configActions}>
              <button className={styles.btnSave} onClick={handleSaveAdvanced} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Guardando...' : 'Guardar configuracion manual'}
              </button>
            </div>

            {/* ── Informacion del Sistema ── */}
            {diagnostics && (
              <>
                <div className={styles.systemSeparator} />
                <h4 className={styles.systemTitle}>Informacion del Sistema</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoMode}>Sistema</span>
                    <span className={styles.infoDesc}>{diagnostics.platform} — Node {diagnostics.nodeVersion}</span>
                  </div>
                  {diagnostics.installedPrinters.length > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoMode}>Impresoras Windows</span>
                      <span className={styles.infoDesc}>{diagnostics.installedPrinters.map((p) => p.name).join(', ')}</span>
                    </div>
                  )}
                  {diagnostics.serialPorts.length > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoMode}>Puertos Seriales</span>
                      <span className={styles.infoDesc}>{diagnostics.serialPorts.map((p) => p.path).join(', ')}</span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <span className={styles.infoMode}>Recomendacion</span>
                    <span className={styles.infoDesc}>{diagnostics.recommendation.reason}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </details>
    </div>
  )
}

export default PrintModeSection

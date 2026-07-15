import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { useError } from '@/context/ErrorContext'
import styles from './PrintModeSection.module.css'

type ConnectionType = 'usb' | 'network' | 'serial'
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

interface UsbPrinter {
  vendorId: number
  productId: number
  name: string
  connectionType: 'usb'
}

interface SerialPort {
  path: string
  manufacturer: string
  vendorId: string
  productId: string
  connectionType: 'serial'
}

interface AvailablePrinters {
  usb: UsbPrinter[]
  serial: SerialPort[]
}

interface TestResult {
  success: boolean
  message: string
  simulated?: boolean
  error?: string
  code?: string
}

const ENCODINGS: Encoding[] = ['CP437', 'CP850', 'CP852', 'CP858', 'CP860', 'CP863', 'CP866', 'CP1252', 'CP932', 'UTF8']
const BAUD_RATES = [9600, 19200, 38400, 57600, 115200]

function getConfig(): Promise<PrinterConfig> {
  return api.get<PrinterConfig>('/configuracion/impresion/config')
}

function setPrintMode(mode: 'simulacion' | 'real'): Promise<PrinterConfig> {
  return api.put<PrinterConfig>('/configuracion/impresion', { modoImpresion: mode })
}

function getAvailablePrinters(): Promise<AvailablePrinters> {
  return api.get<AvailablePrinters>('/configuracion/impresion/printers')
}

function savePrinterConfig(data: Record<string, unknown>): Promise<PrinterConfig> {
  return api.put<PrinterConfig>('/configuracion/impresion/printer', data)
}

async function testPrinter(): Promise<TestResult> {
  return api.post('/configuracion/impresion/test')
}

async function printTestReceipt(): Promise<TestResult> {
  return api.post('/diagnostico/impresora/imprimir-prueba')
}

function PrintModeSection() {
  const { showError, showSuccess } = useError()
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['print-mode'],
    queryFn: getConfig,
  })

  const { data: printers } = useQuery({
    queryKey: ['available-printers'],
    queryFn: getAvailablePrinters,
    refetchOnWindowFocus: true,
  })

  const mode = config?.modoImpresion ?? 'simulacion'

  // Form state
  const [connectionType, setConnectionType] = useState<ConnectionType>('usb')
  const [selectedUsb, setSelectedUsb] = useState<string>('')
  const [customVendorId, setCustomVendorId] = useState('')
  const [customProductId, setCustomProductId] = useState('')
  const [networkAddress, setNetworkAddress] = useState('')
  const [networkPort, setNetworkPort] = useState('9100')
  const [serialPort, setSerialPort] = useState('')
  const [serialBaudRate, setSerialBaudRate] = useState(9600)
  const [printerName, setPrinterName] = useState('')
  const [encoding, setEncoding] = useState<string>('CP858')

  // Populate form from saved config
  useEffect(() => {
    if (!config) return
    setConnectionType(config.printerConnectionType || 'usb')
    setPrinterName(config.printerName || '')
    setEncoding(config.printerEncoding || 'CP858')
    setNetworkPort(String(config.printerNetPort || 9100))
    setSerialBaudRate(config.printerBaudRate || 9600)

    if (config.printerVendorId && config.printerProductId) {
      setSelectedUsb(`custom`)
      setCustomVendorId(String(config.printerVendorId))
      setCustomProductId(String(config.printerProductId))
    }
    if (config.printerAddress) {
      setNetworkAddress(config.printerAddress)
    }
    if (config.printerSerialPort) {
      setSerialPort(config.printerSerialPort)
    }
  }, [config])

  // Auto-select first detected printer when no saved config exists
  useEffect(() => {
    if (config && printers) {
      const hasExistingPrinter = config.printerVendorId || config.printerAddress || config.printerSerialPort
      if (!hasExistingPrinter && printers.usb.length > 0) {
        const first = printers.usb[0]
        setSelectedUsb(`${first.vendorId}:${first.productId}`)
        if (!printerName) setPrinterName(first.name)
        setConnectionType('usb')
      } else if (!hasExistingPrinter && printers.serial.length > 0 && !config.printerSerialPort) {
        const first = printers.serial[0]
        setSerialPort(first.path)
        setConnectionType('serial')
      }
    }
  }, [config, printers])

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
    modeMutation.mutate(next)
  }

  function handleSave() {
    const payload: Record<string, unknown> = {
      printerConnectionType: connectionType,
      printerName: printerName || null,
      printerEncoding: encoding,
    }

    if (connectionType === 'usb') {
      if (selectedUsb === 'custom') {
        payload.printerVendorId = customVendorId ? parseInt(customVendorId, 16) : null
        payload.printerProductId = customProductId ? parseInt(customProductId, 16) : null
      } else if (selectedUsb && printers?.usb) {
        const found = printers.usb.find(
          (p) => `${p.vendorId}:${p.productId}` === selectedUsb
        )
        if (found) {
          payload.printerVendorId = found.vendorId
          payload.printerProductId = found.productId
          if (!printerName) payload.printerName = found.name
        }
      }
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

  return (
    <div className={styles.section}>
      <p className={styles.hint}>
        Define si las impresiones generan <strong>PDF de simulación</strong> o envían datos a una <strong>impresora térmica real</strong>.
      </p>

      {/* ── Toggle de modo ── */}
      <div className={styles.statusCard}>
        <div className={styles.statusRow}>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Modo actual</span>
            <span className={`${styles.statusValue} ${mode === 'simulacion' ? styles.statusSimulate : styles.statusReal}`}>
              {mode === 'simulacion' ? 'Simulación (PDF)' : 'Impresora Real'}
            </span>
          </div>
          <div className={`${styles.indicator} ${mode === 'simulacion' ? styles.indicatorSimulate : styles.indicatorReal}`} />
        </div>

        {mode === 'real' && config && (
          <div className={styles.printerInfo}>
            {config.printerName && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Nombre</span>
                <span className={styles.printerInfoValue}>{config.printerName}</span>
              </div>
            )}
            <div className={styles.printerInfoRow}>
              <span className={styles.printerInfoLabel}>Conexión</span>
              <span className={styles.printerInfoValue}>
                {config.printerConnectionType === 'network' ? 'Red/TCP' : config.printerConnectionType === 'serial' ? 'Serial' : 'USB'}
              </span>
            </div>
            {config.printerVendorId && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Vendor ID</span>
                <span className={styles.printerInfoValue}>0x{config.printerVendorId.toString(16).toUpperCase().padStart(4, '0')}</span>
              </div>
            )}
            {config.printerProductId && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Product ID</span>
                <span className={styles.printerInfoValue}>0x{config.printerProductId.toString(16).toUpperCase().padStart(4, '0')}</span>
              </div>
            )}
            {config.printerAddress && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Dirección</span>
                <span className={styles.printerInfoValue}>{config.printerAddress}:{config.printerNetPort || 9100}</span>
              </div>
            )}
            {config.printerSerialPort && (
              <div className={styles.printerInfoRow}>
                <span className={styles.printerInfoLabel}>Puerto serial</span>
                <span className={styles.printerInfoValue}>{config.printerSerialPort} @ {config.printerBaudRate || 9600}</span>
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
              : 'Cambiar a Simulación'}
        </button>
      </div>

      {/* ── Configurar impresora ── */}
      <div className={styles.configCard}>
        <h4 className={styles.configTitle}>Configurar Impresora</h4>

        {/* Tabs de tipo de conexión */}
        <div className={styles.connTabs}>
          {(['usb', 'network', 'serial'] as ConnectionType[]).map((t) => (
            <button
              key={t}
              className={`${styles.connTab} ${connectionType === t ? styles.connTabActive : ''}`}
              onClick={() => setConnectionType(t)}
            >
              {t === 'usb' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 17h.01" /><path d="M10 7v10" /><path d="M14 17h.01" /><path d="M14 7v10" /><path d="M6 17h.01" /><path d="M6 7v10" /><path d="M18 17h.01" /><path d="M18 7v10" />
                  </svg>
                  USB
                </>
              )}
              {t === 'network' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  Red / Ethernet
                </>
              )}
              {t === 'serial' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Serial
                </>
              )}
            </button>
          ))}
        </div>

        {/* ── USB ── */}
        {connectionType === 'usb' && (
          <div className={styles.connSection}>
            {printers && printers.usb.length > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Impresoras detectadas</label>
                <div className={styles.radioList}>
                  {printers.usb.map((p) => (
                    <label key={`${p.vendorId}:${p.productId}`} className={styles.radioItem}>
                      <input
                        type="radio"
                        name="usb-printer"
                        value={`${p.vendorId}:${p.productId}`}
                        checked={selectedUsb === `${p.vendorId}:${p.productId}`}
                        onChange={(e) => {
                          setSelectedUsb(e.target.value)
                          if (!printerName) setPrinterName(p.name)
                        }}
                      />
                      <span className={styles.radioLabel}>
                        {p.name}
                        <span className={styles.detectedBadge}>Detectada</span>
                        <span className={styles.radioSub}>
                          0x{p.vendorId.toString(16).toUpperCase().padStart(4, '0')}:{p.productId.toString(16).toUpperCase().padStart(4, '0')}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      name="usb-printer"
                      value="custom"
                      checked={selectedUsb === 'custom'}
                      onChange={(e) => setSelectedUsb(e.target.value)}
                    />
                    <span className={styles.radioLabel}>Otra (ingresar manualmente)</span>
                  </label>
                </div>
              </div>
            )}

            {(selectedUsb === 'custom' || !printers || printers.usb.length === 0) && (
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Vendor ID (hex)</label>
                  <input
                    className={styles.inputMono}
                    type="text"
                    placeholder="04B8"
                    value={customVendorId}
                    onChange={(e) => setCustomVendorId(e.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Product ID (hex)</label>
                  <input
                    className={styles.inputMono}
                    type="text"
                    placeholder="0202"
                    value={customProductId}
                    onChange={(e) => setCustomProductId(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Network ── */}
        {connectionType === 'network' && (
          <div className={styles.connSection}>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup} style={{ flex: 2 }}>
                <label className={styles.fieldLabel}>Dirección IP</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="192.168.1.50"
                  value={networkAddress}
                  onChange={(e) => setNetworkAddress(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.fieldLabel}>Puerto TCP</label>
                <input
                  className={styles.input}
                  type="number"
                  placeholder="9100"
                  value={networkPort}
                  onChange={(e) => setNetworkPort(e.target.value)}
                />
              </div>
            </div>
            <p className={styles.connHint}>
              La impresora debe estar conectada a la red local. El puerto por defecto es 9100.
            </p>
          </div>
        )}

        {/* ── Serial ── */}
        {connectionType === 'serial' && (
          <div className={styles.connSection}>
            {printers && printers.serial.length > 0 && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Puertos detectados</label>
                <div className={styles.radioList}>
                  {printers.serial.map((p) => (
                    <label key={p.path} className={styles.radioItem}>
                      <input
                        type="radio"
                        name="serial-port"
                        value={p.path}
                        checked={serialPort === p.path}
                        onChange={(e) => setSerialPort(e.target.value)}
                      />
                      <span className={styles.radioLabel}>
                        {p.path}
                        {p.manufacturer && <span className={styles.radioSub}>{p.manufacturer}</span>}
                      </span>
                    </label>
                  ))}
                  <label className={styles.radioItem}>
                    <input
                      type="radio"
                      name="serial-port"
                      value="custom"
                      checked={serialPort !== '' && !printers.serial.find((p) => p.path === serialPort)}
                      onChange={() => setSerialPort('')}
                    />
                    <span className={styles.radioLabel}>Otro (ingresar manualmente)</span>
                  </label>
                </div>
              </div>
            )}

            {(!printers || printers.serial.length === 0 || serialPort === '' || !printers.serial.find((p) => p.path === serialPort)) && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Puerto COM / ruta</label>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="COM3 o /dev/ttyUSB0"
                  value={serialPort}
                  onChange={(e) => setSerialPort(e.target.value)}
                />
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Baud rate</label>
              <select
                className={styles.select}
                value={serialBaudRate}
                onChange={(e) => setSerialBaudRate(parseInt(e.target.value, 10))}
              >
                {BAUD_RATES.map((br) => (
                  <option key={br} value={br}>{br}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Común ── */}
        <div className={styles.commonSection}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.fieldLabel}>Nombre / Modelo</label>
              <input
                className={styles.input}
                type="text"
                placeholder="EPSON TM-T20"
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.fieldLabel}>Encoding</label>
              <select
                className={styles.select}
                value={encoding}
                onChange={(e) => setEncoding(e.target.value)}
              >
                {ENCODINGS.map((enc) => (
                  <option key={enc} value={enc}>{enc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className={styles.configActions}>
          <button
            className={styles.btnSave}
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Probar ── */}
      <div className={styles.testSection}>
        <h4 className={styles.testTitle}>Probar Impresora</h4>
        <p className={styles.testDesc}>
          Verifica la conexión con la impresora. En modo simulación genera un PDF de prueba.
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
            {testMutation.data.success ? testMutation.data.message : (testMutation.data.error || testMutation.data.message)}
            {testMutation.data.code && !testMutation.data.success && (
              <span className={styles.errorCode}> ({testMutation.data.code})</span>
            )}
          </p>
        )}
        {printTestMutation.isSuccess && printTestMutation.data && (
          <p className={`${styles.testResult} ${printTestMutation.data.success ? styles.testSuccess : styles.testError}`}>
            {printTestMutation.data.success ? printTestMutation.data.message : (printTestMutation.data.error || printTestMutation.data.message)}
          </p>
        )}
      </div>

      {/* ── Info ── */}
      <div className={styles.infoBox}>
        <span className={styles.infoTitle}>¿Qué hace cada modo?</span>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoMode}>Simulación</span>
            <span className={styles.infoDesc}>Genera un archivo PDF con el diseño del recibo. No necesita impresora conectada.</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoMode}>Impresora Real</span>
            <span className={styles.infoDesc}>Envía el comando directo a una impresora térmica por USB, Red o Serial.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintModeSection

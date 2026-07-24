// ─── printer.types.js ────────────────────────────────────────────────────────
// Tipos documentados via JSDoc. El backend es JavaScript puro (ES modules).

/**
 * @typedef {'network' | 'serial' | 'cups' | 'windows-spooler'} ConnectionType
 * @typedef {'available' | 'configured' | 'connected' | 'error' | 'offline'} PrinterStatus
 */

/**
 * @typedef {Object} ConnectionInfo
 * @property {ConnectionType} type
 * @property {string} [address]
 * @property {number} [port]
 * @property {number} [vendorId]
 * @property {number} [productId]
 * @property {number} [baudRate]
 * @property {string} [devicePath]
 * @property {string} [printerName]
 */

/**
 * @typedef {Object} PrinterCapabilities
 * @property {boolean} supportsCut
 * @property {boolean} supportsDrawer
 * @property {number} maxWidth
 * @property {string[]} supportedEncodings
 */

/**
 * @typedef {Object} DetectedPrinter
 * @property {string} id
 * @property {string} name
 * @property {ConnectionType} connectionType
 * @property {number} [vendorId]
 * @property {number} [productId]
 * @property {string} [vendorIdHex]
 * @property {string} [productIdHex]
 * @property {string} [address]
 * @property {number} [port]
 * @property {string} [serialPort]
 * @property {number} [baudRate]
 * @property {ConnectionType[]} compatibleMethods
 * @property {ConnectionType} recommendedMethod
 * @property {PrinterStatus} status
 * @property {string} [manufacturer]
 * @property {string} [pnpDeviceID]
 */

/**
 * @typedef {Object} InstalledPrinter
 * @property {string} name
 * @property {string} portName
 * @property {string} driverName
 * @property {string} pnpDeviceID
 * @property {string} dataType
 * @property {boolean} canPrintEscPos
 * @property {number} status
 */

/**
 * @typedef {Object} SerialDiagnostic
 * @property {string} path
 * @property {string} [manufacturer]
 * @property {string} [vendorId]
 * @property {string} [productId]
 */

/**
 * @typedef {Object} NetworkDiagnostic
 * @property {string} address
 * @property {number} port
 * @property {boolean} isOpen
 * @property {number} [responseTimeMs]
 */

/**
 * @typedef {Object} CupsDiagnostic
 * @property {string} name
 * @property {string} uri
 * @property {string} status
 * @property {boolean} isDefault
 * @property {string} [makeModel]
 */

/**
 * @typedef {Object} DiagnosticsReport
 * @property {string} os
 * @property {string} platform
 * @property {string} nodeVersion
 * @property {string} timestamp
 * @property {InstalledPrinter[]} installedPrinters
 * @property {SerialDiagnostic[]} serialPorts
 * @property {NetworkDiagnostic[]} networkPrinters
 * @property {CupsDiagnostic[]|null} cupsPrinters
 * @property {string|null} cupsDefault
 * @property {{ method: ConnectionType, device?: string, reason: string }} recommendation
 */

/**
 * @typedef {Object} CocinaTicketData
 * @property {number|string} pedidoId
 * @property {string} [mesa]
 * @property {string} [mozo]
 * @property {{ quantity: number, name: string, note?: string }[]} items
 */

/**
 * @typedef {Object} PagoTicketData
 * @property {number|string} [pedidoId]
 * @property {number|string} [facturaId]
 * @property {string} [mesa]
 * @property {{ quantity: number, name: string, unitPrice?: number }[]} items
 * @property {number} subtotal
 * @property {number} [impuestoConsumo]
 * @property {number} [propina]
 * @property {number} total
 */

/**
 * @typedef {Object} CierreTicketData
 * @property {number|string} [turno]
 * @property {string} [usuario]
 * @property {number} ventas
 * @property {number} gastos
 * @property {number} diferencia
 * @property {string} [observaciones]
 */

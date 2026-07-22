// ─── printer.types.js ────────────────────────────────────────────────────────
// Tipos documentados via JSDoc. El backend es JavaScript puro (ES modules).

/**
 * @typedef {'usb' | 'network' | 'serial' | 'cups' | 'windows-spooler'} ConnectionType
 * @typedef {'usbprint' | 'winusb' | 'libusbk' | 'libusb0' | 'unknown'} DriverType
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
 * @property {string} [address]
 * @property {number} [port]
 * @property {string} [serialPort]
 * @property {number} [baudRate]
 * @property {DriverType} [driverType]
 * @property {string} [driverName]
 * @property {ConnectionType[]} compatibleMethods
 * @property {ConnectionType} recommendedMethod
 * @property {PrinterStatus} status
 * @property {string} [manufacturer]
 */

/**
 * @typedef {Object} WindowsDriverInfo
 * @property {string|null} service
 * @property {DriverType} driver
 * @property {boolean} isCompatibleWithRawUsb
 * @property {boolean} isCompatibleWithSpooler
 * @property {string} description
 */

/**
 * @typedef {Object} UsbDiagnostic
 * @property {string} vendorId
 * @property {string} productId
 * @property {number} vendorIdNum
 * @property {number} productIdNum
 * @property {number} usbClass
 * @property {string} usbClassName
 * @property {string|null} driver
 * @property {DriverType} driverType
 * @property {boolean} compatibleWithRawUsb
 * @property {boolean} compatibleWithSpooler
 * @property {string} recommendedMethod
 * @property {string} reason
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
 * @property {UsbDiagnostic[]} usbDevices
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

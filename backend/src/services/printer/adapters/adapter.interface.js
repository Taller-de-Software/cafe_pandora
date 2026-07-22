/**
 * Clase base para adaptadores de impresión.
 * Cada adaptador debe extender esta clase e implementar connect, disconnect y print.
 */
export class BasePrinterAdapter {
  constructor(name, connectionInfo) {
    this._connected = false;
    this._name = name;
    this._connectionInfo = connectionInfo;
  }

  async connect() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
  async print(data) { throw new Error('Not implemented'); }

  isConnected() { return this._connected; }
  getName() { return this._name; }
  getConnectionType() { return this._connectionInfo.type; }
  getConnectionInfo() { return this._connectionInfo; }

  getCapabilities() {
    return {
      supportsCut: true,
      supportsDrawer: true,
      maxWidth: 48,
      supportedEncodings: ['CP437', 'CP850', 'CP858'],
    };
  }
}

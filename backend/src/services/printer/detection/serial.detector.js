/**
 * Detecta puertos seriales disponibles.
 * @returns {Promise<import('../printer.types.js').SerialDiagnostic[]>}
 */
export async function detectSerialPorts() {
  try {
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    return ports
      .filter((p) => p.path && p.path.length > 0)
      .map((p) => ({
        path: p.path,
        manufacturer: p.manufacturer || undefined,
        vendorId: p.vendorId || undefined,
        productId: p.productId || undefined,
      }));
  } catch {
    return [];
  }
}

/**
 * Detecta puertos seriales y los retorna como DetectedPrinter[].
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detect() {
  const ports = await detectSerialPorts();
  return ports.map((p) => ({
    id: `serial-${p.path}`,
    name: p.manufacturer ? `${p.manufacturer} - ${p.path}` : p.path,
    connectionType: 'serial',
    serialPort: p.path,
    compatibleMethods: ['serial'],
    recommendedMethod: 'serial',
    status: 'available',
  }));
}

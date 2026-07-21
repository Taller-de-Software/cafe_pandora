import { execSync } from 'child_process';

/**
 * Detecta impresoras en CUPS (Linux/macOS).
 * @returns {Promise<{ printers: import('../printer.types.js').CupsDiagnostic[], defaultPrinter: string|null }>}
 */
export async function detectCupsPrinters() {
  if (process.platform === 'win32') return { printers: [], defaultPrinter: null };

  try {
    const output = execSync('lpstat -p -d 2>/dev/null', { timeout: 5000, encoding: 'utf-8' });
    const printers = [];
    let defaultPrinter = null;

    for (const line of output.split('\n')) {
      const printerMatch = line.match(/^printer\s+(\S+)\s+is\s+(idle|disabled|processing)/);
      if (printerMatch) {
        printers.push({ name: printerMatch[1], uri: '', status: printerMatch[2], isDefault: false });
      }
      const defaultMatch = line.match(/^system default destination:\s+(\S+)/);
      if (defaultMatch) defaultPrinter = defaultMatch[1];
    }

    for (const p of printers) {
      if (p.name === defaultPrinter) p.isDefault = true;
    }

    // Obtener URI
    try {
      const verbose = execSync('lpstat -v 2>/dev/null', { timeout: 5000, encoding: 'utf-8' });
      for (const line of verbose.split('\n')) {
        const match = line.match(/^device\s+(\S+):\s+(.+)$/);
        if (match) {
          const printer = printers.find((p) => p.name === match[1]);
          if (printer) printer.uri = match[2].trim();
        }
      }
    } catch {}

    return { printers, defaultPrinter };
  } catch {
    return { printers: [], defaultPrinter: null };
  }
}

/**
 * Detecta impresoras CUPS y las retorna como DetectedPrinter[].
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detect() {
  const { printers } = await detectCupsPrinters();
  return printers.map((p) => ({
    id: `cups-${p.name}`,
    name: p.makeModel || p.name,
    connectionType: 'cups',
    compatibleMethods: ['cups'],
    recommendedMethod: 'cups',
    status: p.status === 'idle' ? 'available' : 'error',
  }));
}

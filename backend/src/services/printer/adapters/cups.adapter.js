import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { BasePrinterAdapter } from './adapter.interface.js';

/**
 * Adaptador CUPS para Linux/macOS.
 */
export class CupsAdapter extends BasePrinterAdapter {
  constructor(printerName, encoding = 'CP858') {
    super(`CUPS ${printerName}`, { type: 'cups', printerName });
    this.printerName = printerName;
    this.encoding = encoding;
  }

  async connect() {
    if (process.platform === 'win32') throw new Error('CUPS no está disponible en Windows.');
    try {
      const output = execSync('lpstat -p 2>/dev/null', { timeout: 5000, encoding: 'utf-8' });
      if (!output.includes(this.printerName)) {
        throw new Error(`Impresora "${this.printerName}" no encontrada en CUPS.`);
      }
      this._connected = true;
      console.log(`[CUPS] Conectado — ${this.printerName}`);
    } catch (err) {
      this._connected = false;
      throw new Error(`No se pudo conectar a CUPS (${this.printerName}). Error: ${err.message}`);
    }
  }

  async disconnect() {
    this._connected = false;
  }

  async print(data) {
    if (!this._connected) throw new Error('No hay conexión CUPS activa.');
    const tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.prn`);
    try {
      fs.writeFileSync(tmpFile, data);
      execSync(`lp -d "${this.printerName}" -o raw "${tmpFile}" 2>/dev/null`, { timeout: 10000 });
      return true;
    } catch (err) {
      throw new Error(`Error de impresión CUPS: ${err.message}`);
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

import { execSync } from 'child_process';
import { BasePrinterAdapter } from './adapter.interface.js';

/**
 * Adaptador Windows Print Spooler para impresión RAW.
 * Envía buffers ESC/POS directamente al spooler en modo RAW.
 *
 * Fallback:
 * 1. @plantae-tech/inkpresser (nativo C++)
 * 2. @ssxv/node-printer (nativo C++)
 * 3. PowerShell (último recurso)
 */
export class WindowsSpoolerAdapter extends BasePrinterAdapter {
  constructor(printerName) {
    super(printerName, { type: 'windows-spooler', printerName });
    this.printerName = printerName;
    this.backend = null;
    this.backendInstance = null;
  }

  async connect() {
    if (process.platform !== 'win32') {
      throw new Error('Windows Spooler solo está disponible en Windows.');
    }

    // 1. Intentar inkpresser
    try {
      const inkpresser = await import('@plantae-tech/inkpresser');
      const PrintManager = inkpresser.PrintManager || inkpresser.default?.PrintManager;
      if (PrintManager) {
        const manager = new PrintManager();
        const printers = manager.getPrinters ? await manager.getPrinters() : [];
        const found = printers.find((p) => p.name === this.printerName || p.printerName === this.printerName);
        if (found) {
          this.backend = 'inkpresser';
          this.backendInstance = { manager, printer: found };
          this._connected = true;
          console.log(`[SPOOLER] Conectado via inkpresser — ${this.printerName}`);
          return;
        }
      }
    } catch (e) {
      console.log(`[SPOOLER] inkpresser no disponible: ${e.message}`);
    }

    // 2. Intentar node-printer
    try {
      const nodePrinter = await import('@ssxv/node-printer');
      const list = nodePrinter.printers?.list ? await nodePrinter.printers.list() : [];
      const found = list.find((p) => p.name === this.printerName);
      if (found) {
        this.backend = 'node-printer';
        this.backendInstance = { nodePrinter, printer: found };
        this._connected = true;
        console.log(`[SPOOLER] Conectado via node-printer — ${this.printerName}`);
        return;
      }
    } catch (e) {
      console.log(`[SPOOLER] node-printer no disponible: ${e.message}`);
    }

    // 3. PowerShell fallback
    try {
      const ps = `powershell -NoProfile -NonInteractive -Command "Get-Printer | Where-Object { $_.Name -eq '${this.printerName}' } | Select-Object -ExpandProperty Name"`;
      const result = execSync(ps, { timeout: 8000, windowsHide: true, encoding: 'utf-8' });
      if (result.trim() === this.printerName) {
        this.backend = 'powershell';
        this.backendInstance = {};
        this._connected = true;
        console.log(`[SPOOLER] Usando PowerShell — ${this.printerName}`);
        return;
      }
    } catch (e) {
      console.log(`[SPOOLER] PowerShell verificación falló: ${e.message}`);
    }

    throw new Error(
      `No se pudo conectar a "${this.printerName}". Verifique que esté instalada en Windows.`
    );
  }

  async disconnect() {
    this._connected = false;
    this.backend = null;
    this.backendInstance = null;
  }

  async print(data) {
    if (!this._connected || !this.backend) {
      throw new Error('No hay conexión activa.');
    }

    switch (this.backend) {
      case 'inkpresser': return this._printInkpresser(data);
      case 'node-printer': return this._printNodePrinter(data);
      case 'powershell': return this._printPowerShell(data);
    }
  }

  async _printInkpresser(data) {
    const { printer } = this.backendInstance;
    await printer.printRaw(new Uint8Array(data), 'Cafe Pandora POS');
    return true;
  }

  async _printNodePrinter(data) {
    const { nodePrinter } = this.backendInstance;
    await nodePrinter.jobs.printRaw({
      printer: this.printerName,
      data,
      documentName: 'Cafe Pandora POS',
    });
    return true;
  }

  async _printPowerShell(data) {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.prn`);
    fs.writeFileSync(tmpFile, data);

    const ps = [
      `$printer = "${this.printerName}"`,
      `$file = "${tmpFile.replace(/\\/g, '\\\\')}"`,
      'Start-Process -FilePath $file -Verb PrintTo -ArgumentList $printer -Wait -WindowStyle Hidden',
    ].join('\r\n');

    try {
      execSync(
        `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
        { timeout: 15000, windowsHide: true }
      );
      return true;
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }
}

/**
 * Lista impresoras instaladas en Windows.
 * @returns {Promise<{ name: string, portName: string, driverName: string }[]>}
 */
export async function listWindowsPrinters() {
  if (process.platform !== 'win32') return [];
  try {
    const ps = 'Get-CimInstance Win32_Printer | Select-Object Name, PortName, DriverName | ConvertTo-Json';
    const result = execSync(
      `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
      { timeout: 8000, windowsHide: true, encoding: 'utf-8' }
    );
    const parsed = JSON.parse(result);
    const printers = Array.isArray(parsed) ? parsed : [parsed];
    return printers.filter((p) => p?.Name).map((p) => ({
      name: p.Name,
      portName: p.PortName || '',
      driverName: p.DriverName || '',
    }));
  } catch {
    return [];
  }
}

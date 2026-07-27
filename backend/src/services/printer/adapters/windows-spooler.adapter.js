import { exec } from 'child_process';
import { BasePrinterAdapter } from './adapter.interface.js';

function asyncExec(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 20000, windowsHide: true, ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

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
          console.log(`[SPOOLER] Conectado — ${this.printerName} (inkpresser)`);
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
        console.log(`[SPOOLER] Conectado — ${this.printerName} (node-printer)`);
        return;
      }
    } catch (e) {
      console.log(`[SPOOLER] node-printer no disponible: ${e.message}`);
    }

    // 3. PowerShell fallback
    try {
      const escapedName = this.printerName.replace(/'/g, "''");
      const ps = `powershell -NoProfile -NonInteractive -Command "Get-Printer | Where-Object { $_.Name -eq '${escapedName}' } | Select-Object -ExpandProperty Name"`;
      const { stdout } = await asyncExec(ps, { timeout: 8000, encoding: 'utf-8' });
      if (stdout.trim() === this.printerName) {
        this.backend = 'powershell';
        this.backendInstance = {};
        this._connected = true;
        console.log(`[SPOOLER] Conectado — ${this.printerName} (PowerShell)`);
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

    // 1. Intentar escritura directa al puerto USB (bypass del driver)
    try {
      return await this._printRawDevice(data);
    } catch (e) {
      console.log(`[SPOOLER] Raw device no disponible: ${e.message}, usando backend conectado`);
    }

    // 2. Fallback al backend conectado
    switch (this.backend) {
      case 'inkpresser': return this._printInkpresser(data);
      case 'node-printer': return this._printNodePrinter(data);
      case 'powershell': return this._printPowerShell(data);
      default:
        throw new Error(
          `No se pudo imprimir: backend "${this.backend}" no soportado y escritura directa falló.`
        );
    }
  }

  async _printInkpresser(data) {
    const { printer } = this.backendInstance;
    if (!printer) throw new Error('inkpresser: printer no disponible');
    await printer.printRaw(new Uint8Array(data), 'Cafe Pandora POS');
    return true;
  }

  async _printNodePrinter(data) {
    const { nodePrinter } = this.backendInstance;
    if (!nodePrinter) throw new Error('node-printer: módulo no disponible');
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
      await asyncExec(
        `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
        { timeout: 30000 }
      );
      console.log(`[SPOOLER] Impresión completada — ${this.printerName} (PowerShell)`);
      return true;
    } finally {
      try { fs.unlinkSync(tmpFile); } catch {}
    }
  }

  /**
   * Escribe el RAW ESC/POS directamente al puerto USB del dispositivo
   * (\\.\USB001), BYPASSANDO completamente el driver de la impresora.
   * Solo falla si el puerto está ocupado por el spooler.
   *
   * Prueba múltiples modos de apertura porque FileMode.Create (WriteAllBytes)
   * no funciona correctamente con dispositivos.
   */
  async _printRawDevice(data) {
    const fs = await import('fs');
    const os = await import('os');
    const path = await import('path');
    const tmpDir = os.tmpdir();

    const errors = [];

    // --- Método 1: Node.js fs.writeFileSync ---
    try {
      const devicePath = '\\\\.\\USB001';
      fs.writeFileSync(devicePath, data);
      console.log('[SPOOLER] Raw device write exitoso (fs.writeFileSync)');
      return true;
    } catch (e) {
      errors.push(`fs.writeFileSync: ${e.message}`);
    }

    // --- Método 2: PowerShell FileMode::Open (no Create) ---
    try {
      const prnFile = path.join(tmpDir, `print_${Date.now()}.prn`);
      const psFile  = path.join(tmpDir, `print_${Date.now()}.ps1`);
      fs.writeFileSync(prnFile, data);
      const psScript = [
        `$bytes = [System.IO.File]::ReadAllBytes('${prnFile.replace(/\\/g, '\\\\')}')`,
        `$stream = [System.IO.File]::Open('\\\\.\\USB001', [System.IO.FileMode]::Open, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)`,
        '$stream.Write($bytes, 0, $bytes.Length)',
        '$stream.Flush()',
        '$stream.Close()',
      ].join('\r\n');
      fs.writeFileSync(psFile, psScript);
      await asyncExec(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`,
        { timeout: 30000 }
      );
      console.log('[SPOOLER] Raw device write exitoso (PS FileMode::Open)');
      return true;
    } catch (e) {
      errors.push(`PS FileMode::Open: ${e.message}`);
      try { fs.unlinkSync(prnFile); } catch {}
      try { fs.unlinkSync(psFile); } catch {}
    }

    // --- Método 3: PowerShell WriteAllBytes con FileMode::OpenOrCreate ---
    try {
      const prnFile = path.join(tmpDir, `print_${Date.now()}.prn`);
      const psFile  = path.join(tmpDir, `print_${Date.now()}.ps1`);
      fs.writeFileSync(prnFile, data);
      const psScript = [
        `[System.IO.File]::WriteAllBytes('\\\\.\\USB001', [System.IO.File]::ReadAllBytes('${prnFile.replace(/\\/g, '\\\\')}'))`,
      ].join('\r\n');
      fs.writeFileSync(psFile, psScript);
      await asyncExec(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${psFile}"`,
        { timeout: 30000 }
      );
      console.log('[SPOOLER] Raw device write exitoso (PS WriteAllBytes)');
      return true;
    } catch (e) {
      errors.push(`PS WriteAllBytes: ${e.message}`);
      try { fs.unlinkSync(prnFile); } catch {}
      try { fs.unlinkSync(psFile); } catch {}
    }

    // --- Método 4: cmd.exe copy /b (maneja device paths distinto a PS) ---
    try {
      const prnFile = path.join(tmpDir, `print_${Date.now()}.prn`);
      fs.writeFileSync(prnFile, data);
      await asyncExec(
        `cmd.exe /c copy /b "${prnFile}" \\\\.\\USB001`,
        { timeout: 30000, shell: false }
      );
      console.log('[SPOOLER] Raw device write exitoso (cmd copy /b)');
      return true;
    } catch (e) {
      errors.push(`cmd copy /b: ${e.message}`);
      try { fs.unlinkSync(prnFile); } catch {}
    }

    throw new Error(`Todos los métodos raw device fallaron:\n${errors.join('\n')}`);
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
    const { stdout } = await asyncExec(
      `powershell -NoProfile -NonInteractive -Command "${ps.replace(/"/g, '\\"')}"`,
      { timeout: 8000, encoding: 'utf-8' }
    );
    const parsed = JSON.parse(stdout);
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

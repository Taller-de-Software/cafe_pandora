import escpos from 'escpos';
import { execSync } from 'child_process';
import prisma from '../config/db.config.js';

const DEFAULT_PRINTER_ENCODING = 'CP858';
const SAT_VENDOR_IDS = [0x0416, 0x04b8, 0x067b, 0x0fe6, 0x1fc9];
const PRINTER_CLASS = 0x07;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPrinterErrorMessage(error, extra = {}) {
  const base = extra.modo ? `[${extra.modo}]` : '[IMPRESORA]';
  const device = extra.device ? ` (${extra.device})` : '';
  const puerto = extra.puerto ? ` puerto ${extra.puerto}` : '';

  if (error.message && error.message.includes('Cannot find USB device')) {
    return `${base} Impresora USB no encontrada${device}. Verificar conexión.`;
  }

  if (error.code === 'EACCES' || (error.message && error.message.includes('Access denied'))) {
    return `${base} Permiso denegado al dispositivo USB${puerto}.`;
  }

  if (error.code === 'ENODEV' || (error.message && error.message.includes('no such device'))) {
    return `${base} Dispositivo USB no disponible${puerto}. Puede haber sido desconectado.`;
  }

  if (error.code === 'ETIMEOUT' || error.code === 'ETIMEDOUT') {
    return `${base} Tiempo de espera agotado al conectar con${puerto}.`;
  }

  if (error.code === 'ECONNREFUSED') {
    return `${base} Conexión rechazada en${puerto}. Verificar que la impresora esté encendida.`;
  }

  if (error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH') {
    return `${base} Red inalcanzable${puerto}. Verificar conexión de red.`;
  }

  if (error.message && error.message.includes('write after end')) {
    return `${base} Error al escribir: la impresora cerró la conexión.`;
  }

  return `${base} Error: ${error.message || 'Error desconocido'}${puerto}`;
}

export function getConfigSync() {
  try {
    const result = execSync(
      'node --input-type=commonjs -e "const{PrismaClient}=require(\'@prisma/client\');const p=new PrismaClient();p.configuracion.findUnique({where:{id:1}}).then(r=>{console.log(JSON.stringify(r));p.\$disconnect()})"',
      { cwd: process.cwd(), timeout: 5000 }
    );
    return JSON.parse(result.toString());
  } catch {
    return null;
  }
}

async function getConfigAsync() {
  try {
    return await prisma.configuracion.findUnique({ where: { id: 1 } });
  } catch {
    return null;
  }
}

// ─── Listado de dispositivos ────────────────────────────────────────────────

export function disconnectPrinter() {
  // No-op: escpos printers close automatically after each operation
}

export async function listUsbPrinters() {
  try {
    const devices = escpos.USB.findPrinters();
    return devices
      .filter(d => d.deviceDescriptor && d.deviceDescriptor.bDeviceClass === PRINTER_CLASS)
      .map(d => ({
        vendorId: d.deviceDescriptor.idVendor,
        productId: d.deviceDescriptor.idProduct,
        name: `Printer ${d.deviceDescriptor.idVendor.toString(16).toUpperCase()}:${d.deviceDescriptor.idProduct.toString(16).toUpperCase()}`,
        connectionType: 'usb'
      }));
  } catch {
    return [];
  }
}

export async function listSerialPorts() {
  try {
    const { SerialPort } = await import('serialport');
    const ports = await SerialPort.list();
    return ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer || '',
      vendorId: p.vendorId || '',
      productId: p.productId || '',
      connectionType: 'serial'
    }));
  } catch {
    return [];
  }
}

export async function listAllPrinters() {
  const [usb, serial] = await Promise.all([
    listUsbPrinters(),
    listSerialPorts()
  ]);
  return { usb, serial };
}

// ─── Conexión ───────────────────────────────────────────────────────────────

function openDevice(device) {
  return new Promise((resolve, reject) => {
    device.open(error => {
      if (error) {
        reject(error);
      } else {
        resolve(device);
      }
    });
  });
}

export async function connectPrinter(modo) {
  if (!modo) {
    const config = await getConfigAsync();
    modo = config?.modoImpresion;
  }

  if (modo !== 'directa' && modo !== 'tira') {
    return null;
  }

  const config = await getConfigAsync();
  const encoding = config?.printerEncoding || DEFAULT_PRINTER_ENCODING;

  // Network/TCP
  if (config?.printerConnectionType === 'network' && config?.printerAddress) {
    try {
      const device = new escpos.Network(
        config.printerAddress,
        config.printerNetPort || 9100
      );
      await openDevice(device);
      const printer = new escpos.Printer(device, { encoding });
      console.log(`✅ [IMPRESORA] Conexión: TCP/IP — ${config.printerAddress}:${config.printerNetPort || 9100}`);
      return printer;
    } catch (error) {
      const errorMsg = getPrinterErrorMessage(error, {
        modo,
        device: config.printerName || 'Red',
        puerto: `${config.printerAddress}:${config.printerNetPort || 9100}`
      });
      throw new Error(errorMsg);
    }
  }

  // Serial
  if (config?.printerConnectionType === 'serial' && config?.printerSerialPort) {
    try {
      const { default: Serial } = await import('escpos/serial');
      const device = new Serial(config.printerSerialPort, {
        baudRate: config.printerBaudRate || 9600,
        autoOpen: false
      });
      await openDevice(device);
      const printer = new escpos.Printer(device, { encoding });
      console.log(`✅ [IMPRESORA] Conexión: Serial — ${config.printerSerialPort} @ ${config.printerBaudRate || 9600}`);
      return printer;
    } catch (error) {
      const errorMsg = getPrinterErrorMessage(error, {
        modo,
        device: config.printerName || 'Serial',
        puerto: config.printerSerialPort
      });
      throw new Error(errorMsg);
    }
  }

  // USB con configuración guardada
  if (config?.printerConnectionType === 'usb' || !config?.printerConnectionType) {
    if (config?.printerVendorId && config?.printerProductId) {
      try {
        const device = new escpos.USB(config.printerVendorId, config.printerProductId);
        await openDevice(device);
        const printer = new escpos.Printer(device, { encoding });
        const name = config.printerName || `USB ${config.printerVendorId.toString(16).toUpperCase()}:${config.printerProductId.toString(16).toUpperCase()}`;
        console.log(`✅ [IMPRESORA] Conexión: USB — ${name}`);
        return printer;
      } catch (error) {
        const errorMsg = getPrinterErrorMessage(error, {
          modo,
          device: config.printerName || 'USB',
          puerto: `VID:PID ${config.printerVendorId}:${config.printerProductId}`
        });
        throw new Error(errorMsg);
      }
    }

    // Fallback: auto-detectar primera impresora SAT
    try {
      const devices = escpos.USB.findPrinters();
      const satPrinter = devices.find(d => SAT_VENDOR_IDS.includes(d.deviceDescriptor.idVendor));
      if (!satPrinter) {
        throw new Error('No se encontró impresora conectada al sistema.');
      }
      const device = new escpos.USB(
        satPrinter.deviceDescriptor.idVendor,
        satPrinter.deviceDescriptor.idProduct
      );
      await openDevice(device);
      const printer = new escpos.Printer(device, { encoding });
      console.log(`✅ [IMPRESORA] Conexión: USB auto-detectada`);
      return printer;
    } catch (error) {
      const errorMsg = getPrinterErrorMessage(error, { modo });
      throw new Error(errorMsg);
    }
  }

  throw new Error('[IMPRESORA] Configuración de impresora inválida.');
}

export async function testPrinterConnection() {
  const config = await getConfigAsync();
  if (!config) {
    return { ok: false, message: 'No hay configuración de impresora.' };
  }

  try {
    const printer = await connectPrinter();
    if (!printer) {
      return { ok: false, message: 'Modo de impresión no requiere impresora.' };
    }
    await new Promise((resolve, reject) => {
      printer.close(error => {
        if (error) reject(error);
        else resolve();
      });
    });
    return {
      ok: true,
      message: `Conexión exitosa: ${config.printerConnectionType} — ${config.printerName || 'Sin nombre'}`
    };
  } catch (error) {
    return { ok: false, message: error.message };
  }
}

export async function printTestSlip(modo) {
  const printer = await connectPrinter(modo);
  if (!printer) return false;

  return new Promise((resolve) => {
    try {
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(2, 2)
        .text('CAFE PANDORA')
        .text('POS')
        .feed(2)
        .size(1, 1)
        .style('normal')
        .text('Impresora configurada OK')
        .text('')
        .text(new Date().toLocaleString('es-AR'))
        .feed(4)
        .cut()
        .close(() => {
          console.log(`✅ [IMPRESORA] Ticket de prueba impreso`);
          resolve(true);
        });
    } catch (error) {
      console.error(`❌ [IMPRESORA] Error ticket de prueba:`, error.message);
      try { printer.close(); } catch {}
      resolve(false);
    }
  });
}

export function formatCierreText(cierre) {
  const lines = [];
  lines.push('');
  lines.push('========================================');
  lines.push('       CIERRE DE CAJA - CAFE PANDORA');
  lines.push('========================================');
  lines.push('');
  lines.push(`Fecha: ${new Date().toLocaleDateString('es-AR')}`);
  lines.push(`Hora: ${new Date().toLocaleTimeString('es-AR')}`);
  lines.push(`Turno: ${cierre.turno?.toString() || '-'}`);
  lines.push(`Usuario: ${cierre.usuario?.toString() || '-'}`);
  lines.push('');
  lines.push('----------------------------------------');
  lines.push(`  Ventas: $${cierre.ventas?.toFixed(2) || '0.00'}`);
  lines.push(`  Gastos: $${cierre.gastos?.toFixed(2) || '0.00'}`);
  lines.push(`  Diferencia: $${cierre.diferencia?.toFixed(2) || '0.00'}`);
  lines.push('----------------------------------------');
  if (cierre.observaciones) {
    lines.push(`Obs: ${cierre.observaciones}`);
  }
  lines.push('');
  lines.push('========================================');
  lines.push('');
  lines.push('');
  return lines.join('\n');
}

export async function printCocina(data) {
  const config = await getConfigAsync();
  const modo = config?.modoImpresion ?? 'simulacion';
  if (modo === 'simulacion') return true;

  const printer = await connectPrinter(modo);
  if (!printer) return false;

  return new Promise((resolve) => {
    try {
      const pedidoId = data.pedidoId || '';
      const mesa = data.mesa || '';
      const mozo = data.mozo || '';
      const items = data.items || [];
      const ahora = new Date();
      const fechaStr = ahora.toLocaleDateString('es-AR');
      const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      printer
        .font('a')
        .align('lt')
        .size(1, 1)
        .style('bold')
        .text(`PEDIDO #${pedidoId}`)
        .style('normal')
        .text(`Mesa: ${mesa}`)
        .text(`Mozo: ${mozo}`)
        .text(`${fechaStr} ${horaStr}`)
        .text('--------------------------------');

      for (const item of items) {
        const cantidad = item.cantidad?.toString() || '1';
        const nombre = item.nombre || item.producto?.toString() || 'Item';
        const obs = item.observaciones || '';
        printer
          .style('bold')
          .text(`${cantidad} x ${nombre}`)
          .style('normal');
        if (obs) printer.text(`   Obs: ${obs}`);
      }

      printer
        .text('--------------------------------')
        .feed(4)
        .cut()
        .close(() => {
          console.log(`✅ [IMPRESORA] Pedido #${pedidoId} enviado a cocina`);
          resolve(true);
        });
    } catch (error) {
      console.error(`❌ [IMPRESORA] Error cocina:`, error.message);
      try { printer.close(); } catch {}
      resolve(false);
    }
  });
}

export async function printPago(data) {
  const config = await getConfigAsync();
  const modo = config?.modoImpresion ?? 'simulacion';
  if (modo === 'simulacion') return true;

  const printer = await connectPrinter(modo);
  if (!printer) return false;

  return new Promise((resolve) => {
    try {
      const {
        pedidoId, subtotal, propina, total,
        medioPago, mesero, items, numeroMesa
      } = data;

      const ahora = new Date();
      const fechaStr = ahora.toLocaleDateString('es-AR');
      const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

      printer
        .font('a')
        .align('ct')
        .size(2, 2)
        .style('bu')
        .text('CAFE PANDORA')
        .size(1, 1)
        .style('normal')
        .align('lt')
        .text(`Fecha: ${fechaStr}  Hora: ${horaStr}`)
        .text(`Mesa: ${numeroMesa || '-'}`)
        .text(`Pedido: #${pedidoId || '-'}`)
        .text(`Mesero: ${mesero || '-'}`)
        .text('--------------------------------');

      if (items && items.length > 0) {
        for (const item of items) {
          const cant = item.cantidad?.toString() || '1';
          const nombre = item.nombre || item.producto?.toString() || '';
          const precio = item.precioUnitario || item.precio || 0;
          const lineTotal = Number(precio) * Number(cant);
          printer.text(`${cant} x ${nombre}`);
          printer.align('rt').text(`$${lineTotal.toFixed(2)}`).align('lt');
        }
        printer.text('--------------------------------');
      }

      printer
        .align('rt')
        .style('normal')
        .text(`Subtotal:  $${Number(subtotal || 0).toFixed(2)}`)
        .text(`Propina:   $${Number(propina || 0).toFixed(2)}`)
        .style('bu')
        .size(1, 1)
        .text(`TOTAL:     $${Number(total || 0).toFixed(2)}`)
        .size(1, 1)
        .style('normal')
        .align('lt')
        .text(`Metodo de pago: ${medioPago || 'No especificado'}`)
        .text('--------------------------------')
        .feed(4)
        .cut()
        .close(() => {
          console.log(`✅ [IMPRESORA] Comprobante pago #${pedidoId} impreso`);
          resolve(true);
        });
    } catch (error) {
      console.error(`❌ [IMPRESORA] Error pago:`, error.message);
      try { printer.close(); } catch {}
      resolve(false);
    }
  });
}

export async function printCierre(cierreData) {
  const config = await getConfigAsync();
  const modo = config?.modoImpresion ?? 'simulacion';
  if (modo === 'simulacion') return true;

  const printer = await connectPrinter(modo);
  if (!printer) return false;

  return new Promise((resolve) => {
    try {
      const text = formatCierreText(cierreData);
      const lines = text.split('\n');

      printer
        .font('a')
        .align('lt')
        .size(1, 1);

      lines.forEach(line => printer.text(line));

      printer
        .feed(4)
        .cut()
        .close(() => {
          console.log(`✅ [IMPRESORA] Comprobante de cierre impreso`);
          resolve(true);
        });
    } catch (error) {
      console.error(`❌ [IMPRESORA] Error cierre:`, error.message);
      try { printer.close(); } catch {}
      resolve(false);
    }
  });
}

import escpos from 'escpos';
import { execSync } from 'child_process';
import prisma from '../config/db.config.js';

const DEFAULT_PRINTER_ENCODING = 'CP858';
const SAT_VENDOR_IDS = [0x0416, 0x04b8, 0x067b, 0x0fe6, 0x1fc9];
const PRINTER_CLASS = 0x07;

let lastError = null;

function setLastError(details) {
  lastError = { ...details, timestamp: new Date().toISOString() };
}

export function getLastPrinterError() {
  return lastError;
}

export function clearLastPrinterError() {
  lastError = null;
}

export function getPrinterErrorDetails(error, extra = {}) {
  const modo = extra.modo || null;
  const device = extra.device || null;
  const puerto = extra.puerto || null;
  const tipoConexion = extra.tipoConexion || null;
  const raw = error?.message || 'Error desconocido';

  const build = (codigo, mensaje, sugerencia) => ({
    codigo,
    mensaje,
    detalleTecnico: raw,
    tipoConexion,
    device,
    puerto,
    modo,
    sugerencia,
  });

  if (raw.includes('Cannot find USB device')) {
    return build(
      'USB_NO_ENCONTRADO',
      `Impresora USB no encontrada${device ? ` (${device})` : ''}.`,
      'Verifique que la impresora esté encendida y el cable USB conectado.'
    );
  }

  if (error?.code === 'EACCES' || raw.includes('Access denied')) {
    return build(
      'PERMISO_DENEGADO',
      `Permiso denegado al dispositivo${puerto ? ` ${puerto}` : ''}.`,
      'En Linux, revise las reglas udev del dispositivo o los permisos del usuario que corre el servicio.'
    );
  }

  if (error?.code === 'ENODEV' || raw.includes('no such device')) {
    return build(
      'DISPOSITIVO_NO_DISPONIBLE',
      `Dispositivo no disponible${puerto ? ` ${puerto}` : ''}. Puede haber sido desconectado.`,
      'Reconecte el dispositivo físicamente y reintente.'
    );
  }

  if (error?.code === 'EBUSY') {
    return build(
      'PUERTO_OCUPADO',
      `El puerto${puerto ? ` ${puerto}` : ''} está en uso por otro proceso o conexión abierta.`,
      'Cierre otras aplicaciones/servicios que usen la impresora, o reinicie el servicio backend.'
    );
  }

  if (error?.code === 'ENOENT') {
    return build(
      'PUERTO_NO_EXISTE',
      `El puerto${puerto ? ` ${puerto}` : ''} configurado no existe en este sistema.`,
      'Verifique el nombre del puerto (COM3, /dev/ttyUSB0, etc.) en Configuración > Impresión.'
    );
  }

  if (error?.code === 'ETIMEOUT' || error?.code === 'ETIMEDOUT') {
    return build(
      'TIMEOUT_CONEXION',
      `Tiempo de espera agotado al conectar${puerto ? ` con ${puerto}` : ''}.`,
      'Verifique que la impresora esté encendida y accesible.'
    );
  }

  if (error?.code === 'ECONNREFUSED') {
    return build(
      'TCP_RECHAZADO',
      `Conexión rechazada${puerto ? ` en ${puerto}` : ''}. Verificar que la impresora esté encendida.`,
      'Confirme la IP y el puerto configurados, y que la impresora esté encendida y en red.'
    );
  }

  if (error?.code === 'ENETUNREACH' || error?.code === 'EHOSTUNREACH') {
    return build(
      'RED_INALCANZABLE',
      `Red inalcanzable${puerto ? ` ${puerto}` : ''}. Verificar conexión de red.`,
      'Confirme que el servidor y la impresora estén en la misma red/VLAN.'
    );
  }

  if (raw.includes('write after end')) {
    return build(
      'CONEXION_CERRADA',
      'Error al escribir: la impresora cerró la conexión.',
      'Reintente la impresión; si persiste, reinicie la impresora.'
    );
  }

  if (raw.includes('No se encontró impresora')) {
    return build(
      'SIN_DISPOSITIVO',
      'No se encontró ninguna impresora conectada al sistema.',
      'Conecte una impresora compatible o configure manualmente VID/PID, IP o puerto serial.'
    );
  }

  return build('ERROR_DESCONOCIDO', `Error: ${raw}`, 'Revise los logs del servidor para más detalle.');
}

export function getPrinterErrorMessage(error, extra = {}) {
  const details = getPrinterErrorDetails(error, extra);
  const base = extra.modo ? `[${extra.modo}]` : '[IMPRESORA]';
  return `${base} ${details.mensaje}`;
}

function buildPrinterError(error, extra) {
  const details = getPrinterErrorDetails(error, extra);
  setLastError(details);
  const err = new Error(`${extra.modo ? `[${extra.modo}] ` : '[IMPRESORA] '}${details.mensaje}`);
  Object.assign(err, details);
  return err;
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

export function disconnectPrinter() {
  // No-op mantenido por compatibilidad. Usar printer.close() o
  // closePrinterSafely() para cerrar realmente el dispositivo.
}

export function closePrinterSafely(printer) {
  return new Promise((resolve) => {
    if (!printer || typeof printer.close !== 'function') {
      resolve();
      return;
    }
    try {
      printer.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

export async function connectPrinter(modo) {
  const config = await getConfigAsync();

  if (!modo) {
    modo = config?.modoImpresion;
  }

  if (modo !== 'real') {
    return null;
  }

  const encoding = config?.printerEncoding || DEFAULT_PRINTER_ENCODING;

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
      throw buildPrinterError(error, {
        modo,
        device: config.printerName || 'Red',
        puerto: `${config.printerAddress}:${config.printerNetPort || 9100}`,
        tipoConexion: 'network',
      });
    }
  }

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
      throw buildPrinterError(error, {
        modo,
        device: config.printerName || 'Serial',
        puerto: config.printerSerialPort,
        tipoConexion: 'serial',
      });
    }
  }

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
        throw buildPrinterError(error, {
          modo,
          device: config.printerName || 'USB',
          puerto: `VID:PID ${config.printerVendorId}:${config.printerProductId}`,
          tipoConexion: 'usb',
        });
      }
    }

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
      throw buildPrinterError(error, { modo, tipoConexion: 'usb' });
    }
  }

  throw buildPrinterError(new Error('Configuración de impresora inválida.'), { modo });
}

export async function testPrinterConnection() {
  const config = await getConfigAsync();
  if (!config) {
    return { success: false, message: 'No hay configuración de impresora.' };
  }

  let printer;
  try {
    printer = await connectPrinter();
    if (!printer) {
      return { success: true, message: 'Modo simulación activo — no requiere impresora física.' };
    }
    await closePrinterSafely(printer);
    clearLastPrinterError();
    return {
      success: true,
      message: `Conexión exitosa: ${config.printerConnectionType} — ${config.printerName || 'Sin nombre'}`
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      code: error.codigo,
      sugerencia: error.sugerencia,
      detalleTecnico: error.detalleTecnico,
    };
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
          clearLastPrinterError();
          resolve(true);
        });
    } catch (error) {
      const details = getPrinterErrorDetails(error, { modo, tipoConexion: 'desconocido' });
      setLastError(details);
      console.error(`❌ [IMPRESORA] Error ticket de prueba:`, details.mensaje);
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
          clearLastPrinterError();
          resolve(true);
        });
    } catch (error) {
      const details = getPrinterErrorDetails(error, { modo, tipoConexion: config?.printerConnectionType });
      setLastError(details);
      console.error(`❌ [IMPRESORA] Error cocina:`, details.mensaje);
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
          clearLastPrinterError();
          resolve(true);
        });
    } catch (error) {
      const details = getPrinterErrorDetails(error, { modo, tipoConexion: config?.printerConnectionType });
      setLastError(details);
      console.error(`❌ [IMPRESORA] Error pago:`, details.mensaje);
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
          clearLastPrinterError();
          resolve(true);
        });
    } catch (error) {
      const details = getPrinterErrorDetails(error, { modo, tipoConexion: config?.printerConnectionType });
      setLastError(details);
      console.error(`❌ [IMPRESORA] Error cierre:`, details.mensaje);
      try { printer.close(); } catch {}
      resolve(false);
    }
  });
}
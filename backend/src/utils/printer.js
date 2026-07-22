import escpos from 'escpos';
import { execSync } from 'child_process';
import prisma from '../config/db.config.js';
import usb from 'usb';

const DEFAULT_PRINTER_ENCODING = 'CP858';
const SAT_VENDOR_ID = 0x0483;
const SAT_PRODUCT_ID = 0x5743;
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

  if (raw.includes('No se encontró endpoint OUT')) {
    return build(
      'USB_SIN_ENDPOINT',
      `El dispositivo USB no tiene un endpoint de salida (OUT) disponible.`,
      'Verifique que el dispositivo sea compatible o use otra conexión (Serial/Red).'
    );
  }

  if (raw.includes('LIBUSB_ERROR_NOT_FOUND') || raw.includes('libusb_open failed')) {
    return build(
      'USB_LIBUSB_ERROR',
      `Error de librería USB al abrir el dispositivo.`,
      'Verifique que el driver WinUSB esté instalado correctamente (Zadig) y reinicie el servicio.'
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
  const seen = new Set();
  const result = [];

  try {
    const devices = escpos.USB.findPrinter();
    for (const d of devices) {
      if (d.deviceDescriptor && d.deviceDescriptor.bDeviceClass === PRINTER_CLASS) {
        const key = `${d.deviceDescriptor.idVendor}:${d.deviceDescriptor.idProduct}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            vendorId: d.deviceDescriptor.idVendor,
            productId: d.deviceDescriptor.idProduct,
            name: `Printer ${d.deviceDescriptor.idVendor.toString(16).toUpperCase()}:${d.deviceDescriptor.idProduct.toString(16).toUpperCase()}`,
            connectionType: 'usb'
          });
        }
      }
    }
  } catch {
  }

  try {
    const allDevices = usb.getDeviceList();
    for (const d of allDevices) {
      const desc = d.deviceDescriptor;
      if (!desc) continue;
      if (desc.bDeviceClass === PRINTER_CLASS) {
        const key = `${desc.idVendor}:${desc.idProduct}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            vendorId: desc.idVendor,
            productId: desc.idProduct,
            name: `Printer ${desc.idVendor.toString(16).toUpperCase()}:${desc.idProduct.toString(16).toUpperCase()}`,
            connectionType: 'usb'
          });
        }
      } else if (desc.idVendor === SAT_VENDOR_ID && desc.idProduct === SAT_PRODUCT_ID) {
        const key = `${desc.idVendor}:${desc.idProduct}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({
            vendorId: desc.idVendor,
            productId: desc.idProduct,
            name: `USB Device ${desc.idVendor.toString(16).toUpperCase()}:${desc.idProduct.toString(16).toUpperCase()}`,
            connectionType: 'usb'
          });
        }
      }
    }
  } catch {
  }

  return result;
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

const USB_CHUNK_SIZE = 48;
const USB_CHUNK_TIMEOUT = 8000;

function chunkedTransfer(outEndpoint, data, callback) {
  let offset = 0;
  let anySuccess = false;

  function sendNext() {
    if (offset >= data.length) {
      callback(anySuccess ? null : new Error('No se pudo enviar ningún chunk al dispositivo USB.'));
      return;
    }
    const chunk = data.slice(offset, offset + USB_CHUNK_SIZE);
    offset += USB_CHUNK_SIZE;

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      sendNext();
    }, USB_CHUNK_TIMEOUT);

    try {
      outEndpoint.transfer(chunk, (err) => {
        clearTimeout(timer);
        if (timedOut) return;
        if (!err) anySuccess = true;
        sendNext();
      });
    } catch (e) {
      clearTimeout(timer);
      sendNext();
    }
  }

  sendNext();
}

function createUsbRawDeviceAdapter(vid, pid) {
  const device = usb.findByIds(vid, pid);
  if (!device) return null;

  let outEndpoint = null;
  let claimedIface = null;

  return {
    open(callback) {
      try {
        device.open();
        for (const iface of device.interfaces) {
          try {
            iface.claim();
            claimedIface = iface;
            for (const ep of iface.endpoints) {
              if (ep.direction === 'out') {
                outEndpoint = ep;
                break;
              }
            }
            if (outEndpoint) break;
          } catch {
            if (claimedIface) {
              try { claimedIface.release(true, () => {}); } catch {}
              claimedIface = null;
            }
          }
        }
        if (!outEndpoint) {
          callback(new Error('No se encontró endpoint OUT en el dispositivo USB.'));
          return;
        }
        callback(null);
      } catch (e) {
        callback(e);
      }
    },
    write(data, callback) {
      if (!outEndpoint) {
        callback(new Error('Dispositivo USB no abierto.'));
        return;
      }
      try {
        chunkedTransfer(outEndpoint, data, callback);
      } catch (e) {
        callback(e);
      }
    },
    close(callback) {
      try {
        if (claimedIface) {
          claimedIface.release(true, () => {
            try { device.close(); } catch {}
            if (callback) callback();
          });
        } else {
          device.close();
          if (callback) callback();
        }
      } catch {
        if (callback) callback();
      }
    }
  };
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
      const vid = config.printerVendorId;
      const pid = config.printerProductId;

      const rawDevice = createUsbRawDeviceAdapter(vid, pid);
      if (rawDevice) {
        try {
          await openDevice(rawDevice);
          const printer = new escpos.Printer(rawDevice, { encoding });
          const name = config.printerName || `USB Raw ${vid.toString(16).toUpperCase()}:${pid.toString(16).toUpperCase()}`;
          console.log(`✅ [IMPRESORA] Conexión: USB (raw adapter) — ${name}`);
          return printer;
        } catch (rawError) {
          console.log(`⚠️ [IMPRESORA] Falló raw adapter, intentando escpos.USB...`);
        }
      }

      try {
        const device = new escpos.USB(vid, pid);
        await openDevice(device);
        const printer = new escpos.Printer(device, { encoding });
        const name = config.printerName || `USB ${vid.toString(16).toUpperCase()}:${pid.toString(16).toUpperCase()}`;
        console.log(`✅ [IMPRESORA] Conexión: USB (escpos) — ${name}`);
        return printer;
      } catch (escposError) {
        throw buildPrinterError(escposError, {
          modo,
          device: config.printerName || 'USB',
          puerto: `VID:PID ${vid}:${pid}`,
          tipoConexion: 'usb',
        });
      }
    }

    try {
      const devices = escpos.USB.findPrinter();
      let satPrinter = devices.find(d =>
        d.deviceDescriptor.idVendor === SAT_VENDOR_ID &&
        d.deviceDescriptor.idProduct === SAT_PRODUCT_ID
      );

      if (!satPrinter) {
        const allDevices = usb.getDeviceList();
        for (const d of allDevices) {
          const desc = d.deviceDescriptor;
          if (desc && desc.idVendor === SAT_VENDOR_ID && desc.idProduct === SAT_PRODUCT_ID) {
            satPrinter = { deviceDescriptor: desc };
            break;
          }
        }
      }

      if (!satPrinter) {
        console.log(`⚠️ [IMPRESORA] Impresora SAT 22TUS no encontrada. Se buscaba VendorID=0x${SAT_VENDOR_ID.toString(16).toUpperCase()}, ProductID=0x${SAT_PRODUCT_ID.toString(16).toUpperCase()}`);
        console.log('🔍 [IMPRESORA] Dispositivos USB detectados en el sistema:');
        devices.forEach(d => {
          const desc = d.deviceDescriptor;
          console.log(
            `  VendorID=0x${desc.idVendor.toString(16).toUpperCase()}, ` +
            `ProductID=0x${desc.idProduct.toString(16).toUpperCase()}, ` +
            `bDeviceClass=${desc.bDeviceClass}`
          );
        });

        try {
          const allDevices = usb.getDeviceList();
          allDevices.forEach(d => {
            const desc = d.deviceDescriptor;
            if (desc) {
              console.log(
                `  [usb raw] VendorID=0x${desc.idVendor.toString(16).toUpperCase()}, ` +
                `ProductID=0x${desc.idProduct.toString(16).toUpperCase()}, ` +
                `bDeviceClass=${desc.bDeviceClass}`
              );
            }
          });
        } catch {}

        const dispositivosDetectados = devices.map(d => ({
          idVendor: `0x${d.deviceDescriptor.idVendor.toString(16).toUpperCase()}`,
          idProduct: `0x${d.deviceDescriptor.idProduct.toString(16).toUpperCase()}`,
          bDeviceClass: d.deviceDescriptor.bDeviceClass,
        }));

        const err = new Error('No se encontró impresora conectada al sistema.');
        err.dispositivosDetectados = dispositivosDetectados;
        throw err;
      }

      const vid = satPrinter.deviceDescriptor.idVendor;
      const pid = satPrinter.deviceDescriptor.idProduct;

      const rawDevice = createUsbRawDeviceAdapter(vid, pid);
      if (rawDevice) {
        try {
          await openDevice(rawDevice);
          const printer = new escpos.Printer(rawDevice, { encoding });
          console.log(`✅ [IMPRESORA] Conexión: USB auto-detectada (raw adapter)`);
          return printer;
        } catch (rawError) {
          console.log(`⚠️ [IMPRESORA] Falló raw adapter en auto-detección, intentando escpos.USB...`);
        }
      }

      try {
        const device = new escpos.USB(vid, pid);
        await openDevice(device);
        const printer = new escpos.Printer(device, { encoding });
        console.log(`✅ [IMPRESORA] Conexión: USB auto-detectada (escpos)`);
        return printer;
      } catch (escposError) {
        throw escposError;
      }
    } catch (error) {
      const printerError = buildPrinterError(error, { modo, tipoConexion: 'usb' });
      if (error.dispositivosDetectados) {
        printerError.dispositivosDetectados = error.dispositivosDetectados;
      }
      throw printerError;
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
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('COMANDA DE COCINA')
        .style('normal')
        .align('lt')
        .text(`Mesa: ${mesa}`)
        .text(`${fechaStr} ${horaStr}`)
        .text(`Pedido #${pedidoId}`)
        .text('--------------------------------');

      for (const item of items) {
        const cantidad = item.cantidad?.toString() || '1';
        const nombre = item.nombre || item.producto?.toString() || 'Item';
        const obs = item.nota || '';
        printer.size(2, 1).text(`${cantidad}x  ${nombre}`).size(1, 1);
        if (obs) printer.text(`   (${obs})`);
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
        pedidoId, subtotal, propina, total, items, mesa, impuestoConsumo
      } = data;

      const ahora = new Date();
      const fechaStr = ahora.toLocaleDateString('es-AR');
      const horaStr = ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const fmt = (n) => Math.round(Number(n || 0)).toLocaleString("es-CO");

      printer
        .font('a')
        .align('ct')
        .style('bu')
        .text('PANDORA BISTRO CAFE BAR')
        .style('bold')
        .text('NIT: 1053784676')
        .style('normal')
        .text('Mall Combia')
        .text('Correo: 0')
        .text('Telefono: 0')
        .text('--------------------------------')
        .style('bu')
        .text('RECIBO DE PAGO')
        .style('normal')
        .align('lt')
        .text(`Fecha: ${fechaStr}  Hora: ${horaStr}`)
        .text(`Mesa: ${mesa || '-'}`)
        .text('--------------------------------')
        .style('bold')
        .text('Cant  Producto           Total')
        .style('normal')
        .text('--------------------------------');

      if (items && items.length > 0) {
        for (const item of items) {
          const cant = item.cantidad?.toString() || '1';
          const nombre = item.nombre || item.producto?.toString() || '';
          const precio = item.precioUnitario || item.precio || 0;
          const lineTotal = Number(precio) * Number(cant);
          const line = `${cant}x  ${nombre}`;
          const priceStr = `$${fmt(lineTotal)}`;
          const pad = 32 - line.length - priceStr.length;
          printer.text(pad > 0 ? line + ' '.repeat(pad) + priceStr : line + ' ' + priceStr);
        }
      }

      printer
        .text('--------------------------------')
        .align('rt')
        .style('normal')
        .size(2, 1)
        .text(`Subtotal:        $${fmt(subtotal)}`);

      if (impuestoConsumo != null && impuestoConsumo > 0) {
        printer.size(2, 1).text(`Imp. Consumo 8%: $${fmt(impuestoConsumo)}`);
      }

      if (propina && propina > 0) {
        printer.size(2, 1).text(`Propina:         $${fmt(propina)}`);
      }

      printer
        .size(2, 1)
        .style('bu')
        .text(`TOTAL:           $${fmt(total)}`)
        .size(1, 1)
        .style('normal')
        .align('ct')
        .text('--------------------------------')
        .text('ADVERTENCIA PROPINA')
        .text('Se sugiere una propina')
        .text('correspondiente al 10% del')
        .text('valor de la cuenta, la cual')
        .text('podra ser aceptada,')
        .text('modificada o rechazada por')
        .text('usted.')
        .text('')
        .text('Mas que un lugar, una experiencia')
        .text('para tus sentidos.')
        .style('bu')
        .text('Gracias por su compra!')
        .style('normal')
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
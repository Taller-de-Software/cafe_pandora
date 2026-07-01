import escpos from "escpos";
import usb from "usb";
import { formatearNumero } from "./formatear.js";

// ─────────────────────────────────────────
// IMPRESORA FÍSICA (descomentar cuando llegue la impresora)
// 1. Instalar: pnpm add node-thermal-printer
// 2. Descomentar este bloque
// 3. Cambiar interface al puerto USB real (ver en Dispositivos e impresoras)
// 4. Cambiar type según el modelo (EPSON o STAR)
// 5. En .env cambiar PRINT_MODE=simulate → PRINT_MODE=real
// ─────────────────────────────────────────
// import { ThermalPrinter, PrinterTypes } from "node-thermal-printer";
//
// const thermalPrinter = new ThermalPrinter({
//   type: PrinterTypes.EPSON,  // cambiar según modelo
//   interface: "USB001",       // cambiar al puerto real
//   characterSet: "PC850",
//   removeSpecialCharacters: false,
// });
// ─────────────────────────────────────────

let device = null;

const SAT_VENDOR_IDS = [0x0416, 0x04b8, 0x067b, 0x0fe6, 0x1fc9];

function findSATPrinter() {
  try {
    const devices = escpos.USB.findPrinters();
    if (devices && devices.length > 0) {
      return devices[0];
    }
  } catch {}

  const devices = usb.getDeviceList();
  for (const d of devices) {
    const vid = d.deviceDescriptor.idVendor;
    const pid = d.deviceDescriptor.idProduct;
    if (SAT_VENDOR_IDS.includes(vid)) {
      return { vendorId: vid, productId: pid };
    }
  }

  return null;
}

function connectPrinter() {
  return new Promise((resolve, reject) => {
    try {
      const printerInfo = findSATPrinter();
      if (!printerInfo) {
        return reject(new Error("Impresora no encontrada. Conecta la impresora SAT por USB."));
      }

      device = new escpos.USB(printerInfo.vendorId, printerInfo.productId);
      device.open((err) => {
        if (err) {
          return reject(new Error("Error al abrir la impresora: " + err.message));
        }
        resolve();
      });
    } catch (err) {
      reject(new Error("Error al conectar impresora: " + err.message));
    }
  });
}

function printCocina(data) {
  return new Promise((resolve, reject) => {
    if (!device) {
      return reject(new Error("Impresora no conectada. Ejecuta connectPrinter() primero."));
    }

    const printer = new escpos.Printer(device);

    try {
      printer
        .font("a")
        .align("ct")
        .style("b")
        .size(1, 1)
        .text("=== PANDORA CAFE BAR ===")
        .text("--- FACTURA COCINA ---")
        .text("")
        .align("lt")
        .text(`Pedido #: ${data.pedidoId}`)
        .text(`Mesa: ${data.mesa}`)
        .text(`Mesero: ${data.mesero}`)
        .text(`Fecha: ${data.fecha}`)
        .text("")
        .style("b")
        .text("--- ITEMS ---")
        .style("normal");

      for (const item of data.items) {
        printer.text(`${item.cantidad}x ${item.nombre}`);
        if (item.nota) {
          printer.text(`   Nota: ${item.nota}`);
        }
      }

      printer
        .text("")
        .text("----------------------------")
        .text("")
        .align("ct")
        .text("Gracias por su preferencia")
        .text("")
        .cut()
        .close();

      resolve();
    } catch (err) {
      reject(new Error("Error al imprimir: " + err.message));
    }
  });
}

function printPago(data) {
  return new Promise((resolve, reject) => {
    if (!device) {
      return reject(new Error("Impresora no conectada. Ejecuta connectPrinter() primero."));
    }

    const printer = new escpos.Printer(device);

    try {
      printer
        .font("a")
        .align("ct")
        .style("b")
        .size(1, 1)
        .text("=== PANDORA CAFE BAR ===")
        .text("--- RECIBO DE PAGO ---")
        .text("")
        .align("lt")
        .text(`Factura: ${data.facturaNumero}`)
        .text(`Mesa: ${data.mesa}`)
        .text(`Fecha: ${data.fecha}`)
        .text("")
        .style("b")
        .text("--- DETALLE ---")
        .style("normal");

      for (const item of data.items) {
        const totalItem = formatearNumero(item.cantidad * item.precio);
        printer.text(`${item.cantidad}x ${item.nombre}  $${totalItem}`);
      }

      printer
        .text("")
        .text("----------------------------")
        .style("b")
        .align("rt")
        .text(`TOTAL: $${formatearNumero(data.total)}`)
        .style("normal")
        .align("lt")
        .text("")
        .text("----------------------------")
        .text("")
        .align("ct")
        .text("Gracias por su visita!")
        .text("")
        .cut()
        .close();

      resolve();
    } catch (err) {
      reject(new Error("Error al imprimir: " + err.message));
    }
  });
}

function disconnectPrinter() {
  if (device) {
    try {
      device.close();
    } catch {}
    device = null;
  }
}

export { connectPrinter, printCocina, printPago, disconnectPrinter };

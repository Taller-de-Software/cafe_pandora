import escpos from "escpos";
import usb from "usb";
import { formatearNumero } from "./formatear.js";

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

function alignRight(printer, text, totalWidth) {
  const padding = Math.max(0, totalWidth - text.length);
  return " ".repeat(padding) + text;
}

function formatFechaThermal(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function printCocina(data) {
  return new Promise((resolve, reject) => {
    if (!device) {
      return reject(new Error("Impresora no conectada. Ejecuta connectPrinter() primero."));
    }

    const printer = new escpos.Printer(device);

    try {
      const fechaStr = formatFechaThermal(data.fecha);

      printer
        .align("ct")
        .style("b")
        .size(0, 1)
        .text("COMANDA DE COCINA")
        .size(0, 0)
        .style("normal")
        .text("")
        .align("lt")
        .text(`Mesa: ${data.mesa || "-"}`)
        .text(`Mesero: ${data.mesero || "-"}`)
        .text(`Pedido #${data.pedidoId}`)
        .text(`Fecha: ${fechaStr}`)
        .text("")
        .text("--------------------------------")
        .style("b")
        .text("Cant  Producto")
        .style("normal")
        .text("--------------------------------");

      for (const item of data.items) {
        const cantStr = `${item.cantidad}x`;
        printer.text(`${cantStr.padEnd(5)}${item.nombre}`);
        if (item.nota) {
          printer.text(`      ${item.nota}`);
        }
      }

      printer
        .text("")
        .text("--------------------------------")
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
        .text("PANDORA BISTRO")
        .text("CAFE BAR")
        .style("normal")
        .size(0, 0)
        .text("NIT: 1053784676")
        .text("Medellín")
        .text("")
        .align("lt")
        .text("────────────────────────────────")
        .align("ct")
        .style("b")
        .size(0, 1)
        .text("RECIBO DE PAGO")
        .size(0, 0)
        .style("normal")
        .text("")
        .align("lt");

      if (data.fecha) {
        const fechaStr = formatFechaThermal(data.fecha);
        printer.text(`Fecha: ${fechaStr}`);
      }
      if (data.mesa) printer.text(`Mesa: ${data.mesa}`);
      if (data.cajero) printer.text(`Cajero: ${data.cajero}`);
      if (data.metodoPago) printer.text(`Pago: ${data.metodoPago}`);

      printer
        .text("")
        .text("────────────────────────────────")
        .style("b")
        .text("Cant  Producto            Total")
        .style("normal")
        .text("────────────────────────────────");

      for (const item of data.items) {
        const totalItem = `$${formatearNumero(item.cantidad * item.precio)}`;
        const cantStr = `${item.cantidad}x`;
        const nombreTruncate = item.nombre.length > 18
          ? item.nombre.slice(0, 18)
          : item.nombre;
        const行 = `${cantStr.padEnd(5)}${nombreTruncate.padEnd(22)}${totalItem}`;
        printer.text(行);
      }

      printer.text("────────────────────────────────");

      if (data.subtotal != null) {
        const subStr = `$${formatearNumero(data.subtotal)}`;
        printer.text(`${alignRight(printer, "Subtotal", 28)}${subStr}`);
      }
      if (data.impuestoConsumo != null) {
        const impStr = `$${formatearNumero(data.impuestoConsumo)}`;
        printer.text(`${alignRight(printer, "Imp. Consumo 8%", 28)}${impStr}`);
      }

      if (data.subtotal != null || data.impuestoConsumo != null) {
        printer
          .text("══════════════════════════════════")
          .style("b")
          .size(0, 1);
        const totalStr = `$${formatearNumero(data.total)}`;
        printer.text(`${alignRight(printer, "TOTAL", 28)}${totalStr}`);
        printer
          .size(0, 0)
          .style("normal");
      } else {
        printer
          .style("b")
          .align("rt")
          .text(`TOTAL: $${formatearNumero(data.total)}`)
          .style("normal")
          .align("lt");
      }

      printer
        .text("────────────────────────────────")
        .text("")
        .align("ct")
        .text("Más que un lugar,")
        .text("una experiencia para tus")
        .text("sentidos.")
        .text("")
        .style("b")
        .text("¡Gracias por su compra!")
        .style("normal")
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

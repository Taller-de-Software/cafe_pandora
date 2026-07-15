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
        const err = new Error("Impresora SAT no encontrada. Conecta la impresora por USB.");
        err.code = "PRINTER_NOT_FOUND";
        return reject(err);
      }

      device = new escpos.USB(printerInfo.vendorId, printerInfo.productId);
      device.open((err) => {
        if (err) {
          const code = err.code || "PRINTER_OPEN_ERROR";
          let message = "Error al abrir la impresora";
          if (code === "EACCES") {
            message = "Sin permisos de acceso al dispositivo USB. Ejecuta con permisos de administrador o agrega regla de udev.";
          } else if (code === "ENODEV" || code === "ENOENT") {
            message = "Dispositivo USB no disponible. Reconecta la impresora.";
          } else if (code === "ETIMEOUT") {
            message = "Timeout: la impresora no responde. Verifica la conexión USB.";
          } else {
            message = `Error al abrir la impresora: ${err.message || code}`;
          }
          const openErr = new Error(message);
          openErr.code = code;
          return reject(openErr);
        }
        resolve();
      });
    } catch (err) {
      const wrapErr = new Error("Error al conectar impresora: " + err.message);
      wrapErr.code = err.code || "PRINTER_CONNECT_ERROR";
      reject(wrapErr);
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
        .text("Mesero")
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
          printer.text(`      (${item.nota})`);
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
        .text("Mall Combia")
        .text("Correo: 0")
        .text("Telefono: 0")
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
      if (data.propina != null && data.propina > 0) {
        const propStr = `$${formatearNumero(data.propina)}`;
        printer.text(`${alignRight(printer, "Propina", 28)}${propStr}`);
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
        .style("normal")
        .text("ADVERTENCIA PROPINA")
        .text("Se sugiere una propina del 10%,")
        .text("la cual podra ser aceptada,")
        .text("modificada o rechazada por usted.")
        .text("")
        .style("b")
        .text("Mas que un lugar,")
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

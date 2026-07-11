import prisma from "../../config/db.config.js";
import { connectPrinter, printCocina, printPago, disconnectPrinter } from "../../utils/printer.js";
import { generarPDFComanda, generarPDFRecibo } from "../../utils/pdfGenerator.js";
import { getPrintMode, setPrintMode } from "../../config/print-config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function formatFecha() {
  return new Date().toLocaleString("es-MX", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export const imprimirFacturaCocina = async (pedidoId) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      mesa: true,
      usuario: true,
      detalles: { include: { producto: true } },
    },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const data = {
    pedidoId: pedido.id,
    mesa: pedido.mesa.nombre,
    mesero: pedido.usuario?.nombre || pedido.usuario?.rol || "Sin mesero",
    fecha: formatFecha(),
    items: pedido.detalles.map((d) => ({
      cantidad: d.cantidad,
      nombre: d.producto.nombre,
      nota: d.notas,
    })),
  };

  if (getPrintMode() === "simulate") {
    console.log("🖨️  [IMPRESIÓN SIMULADA]");
    console.log(JSON.stringify(data, null, 2));
    const pdfUrl = await generarPDFComanda(data);
    return { pdfUrl };
  }

  await connectPrinter();
  await printCocina(data);
  disconnectPrinter();

  return { message: "Factura de cocina impresa", pedidoId };
};

export const imprimirReciboPago = async (facturaId) => {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      pedido: {
        include: {
          mesa: true,
          detalles: { include: { producto: true } },
        },
      },
    },
  });

  if (!factura) throw crearError(404, "Factura no encontrada");

  const mesa = factura.pedido.mesa.nombre;
  const items = factura.pedido.detalles.map((d) => ({
    cantidad: d.cantidad,
    nombre: d.producto.nombre,
    precio: d.precioUnitario,
  }));

  const data = {
    facturaId: factura.id,
    facturaNumero: `#${factura.id}`,
    mesa,
    fecha: formatFecha(),
    items,
    total: factura.total,
  };

  if (getPrintMode() === "simulate") {
    console.log("🖨️  [IMPRESIÓN SIMULADA]");
    console.log(JSON.stringify(data, null, 2));
    const pdfUrl = await generarPDFRecibo(data);
    return { pdfUrl };
  }

  await connectPrinter();
  await printPago(data);
  disconnectPrinter();

  return { message: "Recibo de pago impreso", facturaId: factura.id };
};

export const probarImpresora = async () => {
  if (getPrintMode() === "simulate") {
    console.log("🖨️  [IMPRESIÓN SIMULADA]");
    return { message: "Modo simulación activo" };
  }
  await connectPrinter();
  disconnectPrinter();
  return { message: "Impresora conectada exitosamente" };
};

export const obtenerModoImpresion = () => {
  return { mode: getPrintMode() };
};

export const cambiarModoImpresion = (mode) => {
  setPrintMode(mode);
  return { mode: getPrintMode() };
};

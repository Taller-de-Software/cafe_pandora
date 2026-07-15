import prisma from "../../config/db.config.js";
import { connectPrinter, printCocina, printPago, disconnectPrinter } from "../../utils/printer.js";
import { generarPDFComanda, generarPDFRecibo } from "../../utils/pdfGenerator.js";
import { leerModoImpresion } from "../../config/print-config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function formatFecha() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
    mesa: pedido.mesa?.nombre,
    mesero: pedido.usuario?.nombre || pedido.usuario?.rol || "Sin mesero",
    fecha: new Date(),
    items: pedido.detalles.map((d) => ({
      cantidad: d.cantidad,
      nombre: d.producto.nombre,
      nota: d.notas,
    })),
  };

  const modo = await leerModoImpresion();

  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA - COCINA]");
    const pdfUrl = await generarPDFComanda(data);
    return { pdfUrl };
  }

  await connectPrinter();
  try {
    await printCocina(data);
  } finally {
    disconnectPrinter();
  }

  return { message: "Comanda de cocina impresa", pedidoId };
};

export const imprimirReciboPago = async (facturaId) => {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      pedido: {
        include: {
          mesa: true,
          usuario: true,
          detalles: { include: { producto: true } },
        },
      },
    },
  });

  if (!factura) throw crearError(404, "Factura no encontrada");

  const mesa = factura.pedido.mesa?.nombre;
  const items = factura.pedido.detalles.map((d) => ({
    cantidad: d.cantidad,
    nombre: d.producto.nombre,
    precio: d.precioUnitario,
  }));

  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
  const impuestoConsumo = Math.round(subtotal * 0.08);

  const data = {
    facturaId: factura.id,
    facturaNumero: `#${factura.id}`,
    mesa,
    fecha: new Date(),
    items,
    subtotal,
    impuestoConsumo,
    propina: factura.propina,
    total: factura.total,
  };

  const modo = await leerModoImpresion();

  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA - PAGO]");
    const pdfUrl = await generarPDFRecibo(data);
    return { pdfUrl };
  }

  await connectPrinter();
  try {
    await printPago(data);
  } finally {
    disconnectPrinter();
  }

  return { message: "Recibo de pago impreso", facturaId: factura.id };
};

export const probarImpresora = async () => {
  const modo = await leerModoImpresion();
  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA]");
    return { message: "Modo simulación activo" };
  }
  await connectPrinter();
  try {
    return { message: "Impresora conectada exitosamente" };
  } finally {
    disconnectPrinter();
  }
};

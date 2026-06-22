import prisma from "../../config/db.config.js";
import { connectPrinter, printCocina, printPago, disconnectPrinter } from "../../utils/printer.js";

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
      mesero: { select: { nombre: true } },
      detalles: { include: { producto: true } },
    },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");

  await connectPrinter();

  const data = {
    pedidoId: pedido.id,
    mesa: pedido.mesa.numero,
    mesero: pedido.mesero.nombre,
    fecha: formatFecha(),
    items: pedido.detalles.map((d) => ({
      cantidad: d.cantidad,
      nombre: d.producto.nombre,
      nota: d.nota,
    })),
  };

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
      grupoPago: {
        include: {
          pedidos: {
            include: { detalles: { include: { producto: true } }, mesa: true },
          },
        },
      },
    },
  });

  if (!factura) throw crearError(404, "Factura no encontrada");

  await connectPrinter();

  let items = [];
  let mesa = "";
  let total = factura.total || 0;

  if (factura.grupoPago) {
    for (const p of factura.grupoPago.pedidos) {
      mesa = p.mesa.numero;
      for (const d of p.detalles) {
        items.push({
          cantidad: d.cantidad,
          nombre: d.producto.nombre,
          precio: d.precio,
        });
      }
    }
    total = factura.grupoPago.total;
  } else {
    mesa = factura.pedido.mesa.numero;
    for (const d of factura.pedido.detalles) {
      items.push({
        cantidad: d.cantidad,
        nombre: d.producto.nombre,
        precio: d.precio,
      });
    }
    total = factura.pedido.detalles.reduce((sum, d) => sum + d.cantidad * d.precio, 0);
  }

  const data = {
    facturaNumero: factura.numero,
    mesa,
    fecha: formatFecha(),
    items,
    total,
  };

  await printPago(data);
  disconnectPrinter();

  return { message: "Recibo de pago impreso", facturaId: factura.id };
};

export const probarImpresora = async () => {
  await connectPrinter();
  disconnectPrinter();
  return { message: "Impresora conectada exitosamente" };
};

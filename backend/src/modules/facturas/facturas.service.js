import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "../../config/db.config.js";
import { connectPrinter, printPago, disconnectPrinter } from "../../utils/printer.js";
import { ESTADOS_PEDIDO, ESTADOS_MESA } from "../../config/constants.js";
import { leerModoImpresion } from "../../config/print-config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FACTURAS_DIR = path.join(__dirname, "../../../../uploads/facturas");

function scanComprobanteRuta(id) {
  if (!fs.existsSync(FACTURAS_DIR)) return null;
  const files = fs.readdirSync(FACTURAS_DIR);
  const match = files.find((f) => f.startsWith(`pago-${id}-`) && f.endsWith(".pdf"));
  return match ? path.join(FACTURAS_DIR, match) : null;
}

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const obtenerComprobante = async (id) => {
  const factura = await prisma.factura.findUnique({
    where: { id },
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

  const modo = await leerModoImpresion();

  if (modo === "real") {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");

    const items = factura.pedido.detalles.map((det) => ({
      cantidad: det.cantidad,
      nombre: det.producto.nombre,
      precio: det.precioUnitario,
    }));
    const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);

    const data = {
      facturaId: factura.id,
      facturaNumero: `#${factura.id}`,
      mesa: factura.pedido.mesa?.nombre,
      cajero: factura.pedido.usuario?.nombre || factura.pedido.usuario?.rol,
      fecha: `${dd}/${mm}/${yyyy} ${hh}:${min}`,
      items,
      subtotal,
      impuestoConsumo: factura.impuestoConsumo,
      total: factura.total,
    };
    await connectPrinter();
    try {
      await printPago(data);
    } finally {
      disconnectPrinter();
    }
    return { message: "Recibo reenviado a la impresora" };
  }

  const pdfRuta = scanComprobanteRuta(id);
  if (pdfRuta) return { pdfUrl: `/uploads/facturas/${path.basename(pdfRuta)}` };
  throw crearError(404, "El comprobante ya no está disponible");
};

export const comprobanteDisponible = async (id) => {
  const modo = await leerModoImpresion();
  if (modo === "real") return { disponible: true, modo: "real" };
  const pdfRuta = scanComprobanteRuta(id);
  return { disponible: !!pdfRuta, modo: "simulacion" };
};

export const descargarComprobante = async (id) => {
  const modo = await leerModoImpresion();
  if (modo === "real") throw crearError(400, "Modo impresión real: use reimprimir en vez de descargar");

  const pdfRuta = scanComprobanteRuta(id);
  if (!pdfRuta) throw crearError(404, "El comprobante ya no está disponible");
  return pdfRuta;
};

export const listar = async (filters = {}) => {
  const where = {};
  if (filters.pedidoId) where.pedidoId = filters.pedidoId;

  return prisma.factura.findMany({
    where,
    include: {
      pedido: {
        include: {
          mesa: true,
          detalles: { include: { producto: true } },
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const obtener = async (id) => {
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      pedido: {
        include: {
          mesa: true,
          usuario: { select: { id: true, rol: true } },
          detalles: { include: { producto: true } },
        },
      },
    },
  });
  if (!factura) throw crearError(404, "Factura no encontrada");
  return factura;
};

export const crear = async (data) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: data.pedidoId },
    include: { mesa: true, factura: true },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.factura) throw crearError(400, "El pedido ya tiene una factura");

  const sesion = await prisma.cajaSesion.findUnique({ where: { id: data.cajaSesionId } });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  if (sesion.cierre) throw crearError(400, "La sesión de caja ya está cerrada");

  const factura = await prisma.$transaction(async (tx) => {
    const f = await tx.factura.create({
      data: {
        pedidoId: data.pedidoId,
        subtotal: data.subtotal,
        impuestoConsumo: data.impuestoConsumo,
        total: data.total,
        metodoPagoId: data.metodoPagoId,
        cajaSesionId: data.cajaSesionId,
      },
      include: {
        metodoPago: true,
        pedido: {
          include: { detalles: { include: { producto: true } }, mesa: true },
        },
      },
    });

    await tx.pedido.update({
      where: { id: data.pedidoId },
      data: { estado: ESTADOS_PEDIDO.FINALIZADO, finalizadoEn: new Date(), total: data.total, fechaPago: new Date() },
    });

    await tx.cajaSesion.update({
      where: { id: data.cajaSesionId },
      data: {
        totalVentas: { increment: data.total },
        totalEnCaja: { increment: data.total },
      },
    });

    const pedidosActivos = await tx.pedido.count({
      where: { mesaId: pedido.mesaId, estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] } },
    });
    if (pedidosActivos === 0) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: ESTADOS_MESA.VACIA },
      });
    }

    return f;
  });

  return factura;
};

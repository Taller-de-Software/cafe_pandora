import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "../../config/db.config.js";
import { connectPrinter, printPago, disconnectPrinter } from "../../utils/printer.js";
import { ESTADOS_PEDIDO, ESTADOS_MESA } from "../../config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FACTURAS_DIR = path.join(__dirname, "../../../../uploads/facturas");

function scanComprobante(id) {
  if (!fs.existsSync(FACTURAS_DIR)) return null;
  const files = fs.readdirSync(FACTURAS_DIR);
  const match = files.find((f) => f.startsWith(`pago-${id}-`) && f.endsWith(".pdf"));
  return match ? `/uploads/facturas/${match}` : null;
}

async function leerModoImpresion() {
  const config = await prisma.configuracion.findFirst();
  return config?.modoImpresion ?? "simulacion";
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
      metodoPago: true,
      pedido: {
        include: {
          mesa: true,
          detalles: { include: { producto: true } },
        },
      },
    },
  });
  if (!factura) throw crearError(404, "Factura no encontrada");

  const modo = await leerModoImpresion();

  if (modo === "real") {
    const data = {
      facturaId: factura.id,
      mesa: factura.pedido.mesa.nombre,
      fecha: new Date().toLocaleString("es-CO", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }),
      metodoPago: factura.metodoPago.nombre,
      items: factura.pedido.detalles.map((d) => ({
        cantidad: d.cantidad,
        nombre: d.producto.nombre,
        precio: d.precioUnitario,
        nota: d.notas,
      })),
      subtotal: factura.subtotal,
      impuesto: factura.impuestoConsumo,
      total: factura.total,
    };
    await connectPrinter();
    await printPago(data);
    disconnectPrinter();
    return { message: "Recibo reenviado a la impresora" };
  }

  const pdfUrl = scanComprobante(id);
  if (pdfUrl) return { pdfUrl };
  throw crearError(404, "El comprobante ya no está disponible");
};

export const comprobanteDisponible = async (id) => {
  const modo = await leerModoImpresion();
  if (modo === "real") return { disponible: true, modo: "real" };
  const pdfUrl = scanComprobante(id);
  return { disponible: !!pdfUrl, modo: "simulacion" };
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

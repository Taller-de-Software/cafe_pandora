import prisma from "../../config/db.config.js";
import { ESTADOS_PEDIDO, ESTADOS_MESA } from "../../config/constants.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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
    orderBy: { pagadoEn: "desc" },
  });
};

export const obtener = async (id) => {
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      pedido: {
        include: {
          mesa: true,
          usuario: { select: { id: true, nombre: true, rol: true } },
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
    include: { mesa: true },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const factura = await prisma.factura.create({
    data: {
      pedidoId: data.pedidoId,
      subtotal: data.subtotal,
      impuestoConsumo: data.impuestoConsumo,
      total: data.total,
      cambio: data.cambio || null,
      metodoPago: data.metodoPago,
      entidadBancaria: data.entidadBancaria,
    },
    include: {
      pedido: {
        include: { detalles: { include: { producto: true } }, mesa: true },
      },
    },
  });

  await prisma.pedido.update({
    where: { id: data.pedidoId },
    data: { estado: ESTADOS_PEDIDO.FACTURADO, facturadoEn: new Date(), total: data.total },
  });

  const sesionActiva = await prisma.cajaSesion.findFirst({ where: { cierre: null } });
  if (sesionActiva) {
    await prisma.cajaSesion.update({
      where: { id: sesionActiva.id },
      data: {
        totalVentas: { increment: data.total },
        totalEnCaja: { increment: data.total },
      },
    });
  }

  const pedidosActivos = await prisma.pedido.count({
    where: { mesaId: pedido.mesaId, estado: { notIn: ["facturado", "cancelado"] } },
  });
  if (pedidosActivos === 0) {
    await prisma.mesa.update({
      where: { id: pedido.mesaId },
      data: { estado: ESTADOS_MESA.VACIA, ocupadaDesde: null, meseroActualId: null },
    });
  }

  return factura;
};

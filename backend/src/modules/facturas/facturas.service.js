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
      data: { estado: ESTADOS_PEDIDO.FINALIZADO, finalizadoEn: new Date(), total: data.total },
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

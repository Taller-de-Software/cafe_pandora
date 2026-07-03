import prisma from "../../config/db.config.js";
import { ESTADOS_PEDIDO, ESTADOS_MESA } from "../../config/constants.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listar = async (filters = {}) => {
  const where = {};
  if (filters.estado) where.estado = filters.estado;
  if (filters.mesaId) where.mesaId = filters.mesaId;

  return prisma.pedido.findMany({
    where,
    include: {
      mesa: true,
      usuario: { select: { id: true, rol: true } },
      detalles: { include: { producto: true } },
      factura: true,
    },
    orderBy: { creadoEn: "desc" },
  });
};

export const obtener = async (id) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      mesa: true,
      usuario: { select: { id: true, rol: true } },
      detalles: { include: { producto: true } },
      factura: true,
    },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  return pedido;
};

export const crear = async (data, usuarioId) => {
  const items = await Promise.all(
    data.items.map(async (item) => {
      const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
      if (!producto) throw crearError(404, `Producto ${item.productoId} no encontrado`);
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas || null,
      };
    })
  );

  const totalItems = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);

  const pedido = await prisma.$transaction(async (tx) => {
    const p = await tx.pedido.create({
      data: {
        turno: data.turno,
        mesaId: data.mesaId,
        mesaOrigenId: data.mesaOrigenId || null,
        usuarioId,
        total: totalItems,
        estado: ESTADOS_PEDIDO.RECIBIDO,
        detalles: { create: items },
      },
      include: {
        mesa: true,
        usuario: { select: { id: true, rol: true } },
        detalles: { include: { producto: true } },
      },
    });

    await tx.mesa.update({
      where: { id: data.mesaId },
      data: { estado: ESTADOS_MESA.OCUPADA },
    });

    return p;
  });

  return pedido;
};

export const cambiarEstado = async (id, nuevoEstado) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const transicionesValidas = {
    [ESTADOS_PEDIDO.RECIBIDO]: [ESTADOS_PEDIDO.PENDIENTE, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.HECHO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.HECHO]: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.FINALIZADO]: [],
    [ESTADOS_PEDIDO.CANCELADO]: [],
  };

  if (!transicionesValidas[pedido.estado]?.includes(nuevoEstado)) {
    throw crearError(400, `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
  }

  const timestamps = {};
  if (nuevoEstado === ESTADOS_PEDIDO.PENDIENTE) timestamps.pendienteEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.HECHO) timestamps.hechoEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.FINALIZADO) timestamps.finalizadoEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) timestamps.canceladoEn = new Date();

  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.update({
      where: { id },
      data: { estado: nuevoEstado, ...timestamps },
      include: {
        mesa: true,
        detalles: { include: { producto: true } },
      },
    });

    if (nuevoEstado === ESTADOS_PEDIDO.FINALIZADO) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: ESTADOS_MESA.POR_PAGAR },
      });
    }

    if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) {
      const activos = await tx.pedido.count({
        where: {
          mesaId: pedido.mesaId,
          id: { not: id },
          estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] },
        },
      });
      if (activos === 0) {
        await tx.mesa.update({
          where: { id: pedido.mesaId },
          data: { estado: ESTADOS_MESA.VACIA },
        });
      }
    }

    return p;
  });
};

export const cancelar = async (id) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede cancelar un pedido en estado ${pedido.estado}`);
  }

  return prisma.pedido.update({
    where: { id },
    data: { estado: ESTADOS_PEDIDO.CANCELADO, canceladoEn: new Date() },
    include: {
      mesa: true,
      detalles: { include: { producto: true } },
    },
  });
};

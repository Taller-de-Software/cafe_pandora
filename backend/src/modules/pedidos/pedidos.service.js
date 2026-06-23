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

  const pedido = await prisma.pedido.create({
    data: {
      turno: data.turno,
      mesaId: data.mesaId,
      usuarioId,
      estado: ESTADOS_PEDIDO.RECIBIDO,
      detalles: { create: items },
    },
    include: {
      mesa: true,
      usuario: { select: { id: true, rol: true } },
      detalles: { include: { producto: true } },
    },
  });

  await prisma.mesa.update({
    where: { id: data.mesaId },
    data: { estado: ESTADOS_MESA.OCUPADA },
  });

  return pedido;
};

export const cambiarEstado = async (id, nuevoEstado) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const transicionesValidas = {
    [ESTADOS_PEDIDO.RECIBIDO]: [ESTADOS_PEDIDO.PENDIENTE, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.HECHO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.HECHO]: [],
    [ESTADOS_PEDIDO.CANCELADO]: [],
  };

  if (!transicionesValidas[pedido.estado]?.includes(nuevoEstado)) {
    throw crearError(400, `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
  }

  const timestamps = {};
  if (nuevoEstado === ESTADOS_PEDIDO.PENDIENTE) timestamps.pendienteEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.HECHO) timestamps.hechoEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) timestamps.cerradoEn = new Date();

  return prisma.pedido.update({
    where: { id },
    data: { estado: nuevoEstado, ...timestamps },
    include: {
      mesa: true,
      detalles: { include: { producto: true } },
    },
  });
};

export const cancelar = async (id) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  return prisma.pedido.update({
    where: { id },
    data: { estado: ESTADOS_PEDIDO.CANCELADO, cerradoEn: new Date() },
    include: {
      mesa: true,
      detalles: { include: { producto: true } },
    },
  });
};

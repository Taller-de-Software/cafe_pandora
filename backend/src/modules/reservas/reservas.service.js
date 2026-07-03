import prisma from "../../config/db.config.js";
import { ESTADOS_MESA } from "../../config/constants.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listar = async (filters = {}) => {
  const where = {};
  if (filters.mesaId) where.mesaId = filters.mesaId;
  if (filters.fecha) {
    const inicio = new Date(filters.fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(filters.fecha);
    fin.setHours(23, 59, 59, 999);
    where.fecha = { gte: inicio, lte: fin };
  }
  if (filters.estado) where.estado = filters.estado;

  return prisma.reserva.findMany({
    where,
    include: { mesa: true },
    orderBy: { fecha: "asc" },
  });
};

export const crear = async (data) => {
  const mesa = await prisma.mesa.findUnique({ where: { id: data.mesaId } });
  if (!mesa) throw crearError(404, "Mesa no encontrada");
  if (mesa.estado === ESTADOS_MESA.FUERA_DE_SERVICIO) {
    throw crearError(400, "La mesa está fuera de servicio");
  }

  const reserva = await prisma.$transaction(async (tx) => {
    if (mesa.estado === ESTADOS_MESA.VACIA) {
      await tx.mesa.update({
        where: { id: data.mesaId },
        data: { estado: ESTADOS_MESA.RESERVADA },
      });
    }

    return tx.reserva.create({
      data: {
        cliente: data.cliente,
        telefono: data.telefono || null,
        fecha: new Date(data.fecha),
        hora: data.hora,
        personas: data.personas,
        mesaId: data.mesaId,
      },
      include: { mesa: true },
    });
  });

  return reserva;
};

export const cancelar = async (id) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!reserva) throw crearError(404, "Reserva no encontrada");
  if (reserva.estado === "cancelada" || reserva.estado === "completada") {
    throw crearError(400, "La reserva ya está cancelada o completada");
  }

  return prisma.$transaction(async (tx) => {
    const r = await tx.reserva.update({
      where: { id },
      data: { estado: "cancelada" },
    });

    const activas = await tx.reserva.count({
      where: { mesaId: reserva.mesaId, estado: { in: ["pendiente", "confirmada"] } },
    });

    if (activas === 0) {
      const pedidosActivos = await tx.pedido.count({
        where: {
          mesaId: reserva.mesaId,
          estado: { notIn: ["finalizado", "cancelado"] },
        },
      });

      if (pedidosActivos === 0) {
        await tx.mesa.update({
          where: { id: reserva.mesaId },
          data: { estado: ESTADOS_MESA.VACIA },
        });
      }
    }

    return r;
  });
};

export const convertir = async (id, data, usuarioId) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!reserva) throw crearError(404, "Reserva no encontrada");
  if (reserva.estado === "cancelada" || reserva.estado === "completada") {
    throw crearError(400, "La reserva ya está cancelada o completada");
  }

  return prisma.$transaction(async (tx) => {
    await tx.reserva.update({
      where: { id },
      data: { estado: "completada" },
    });

    await tx.mesa.update({
      where: { id: reserva.mesaId },
      data: { estado: ESTADOS_MESA.OCUPADA },
    });

    const pedido = await tx.pedido.create({
      data: {
        turno: data.turno,
        mesaId: reserva.mesaId,
        usuarioId,
        total: 0,
        estado: "recibido",
      },
      include: {
        mesa: true,
        usuario: { select: { id: true, rol: true } },
      },
    });

    return pedido;
  });
};

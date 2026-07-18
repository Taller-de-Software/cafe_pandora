import prisma from "../../config/db.config.js";

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
  if (filters.estado) {
    const estados = filters.estado.split(",").map((e) => e.trim());
    where.estado = { in: estados };
  }

  return prisma.reserva.findMany({
    where,
    include: { mesa: true },
    orderBy: { fecha: "asc" },
  });
};

export const crear = async (data) => {
  const mesa = await prisma.mesa.findUnique({ where: { id: data.mesaId } });
  if (!mesa) throw crearError(404, "Mesa no encontrada");
  if (mesa.estado === "fuera_de_servicio") {
    throw crearError(400, "La mesa está fuera de servicio");
  }

  return prisma.reserva.create({
    data: {
      cliente: data.cliente,
      telefono: data.telefono || null,
      fecha: new Date(data.fecha),
      hora: data.hora,
      personas: data.personas,
      observaciones: data.observaciones || null,
      mesaId: data.mesaId,
    },
    include: { mesa: true },
  });
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

  return prisma.reserva.update({
    where: { id },
    data: { estado: "cancelada" },
  });
};

export const actualizar = async (id, data) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!reserva) throw crearError(404, "Reserva no encontrada");
  if (reserva.estado === "cancelada" || reserva.estado === "completada") {
    throw crearError(400, "No se puede editar una reserva cancelada o completada");
  }

  const updateData = {};
  if (data.cliente !== undefined) updateData.cliente = data.cliente;
  if (data.telefono !== undefined) updateData.telefono = data.telefono || null;
  if (data.fecha !== undefined) updateData.fecha = new Date(data.fecha);
  if (data.hora !== undefined) updateData.hora = data.hora;
  if (data.personas !== undefined) updateData.personas = data.personas;
  if (data.observaciones !== undefined) updateData.observaciones = data.observaciones || null;

  return prisma.reserva.update({
    where: { id },
    data: updateData,
    include: { mesa: true },
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

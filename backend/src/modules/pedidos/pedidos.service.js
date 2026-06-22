import prisma from "../../config/db.config.js";
import { ESTADOS_PEDIDO } from "../../config/constants.js";

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
      mesero: { select: { id: true, nombre: true } },
      detalles: { include: { producto: true } },
      facturas: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

export const obtener = async (id) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      mesa: true,
      mesero: { select: { id: true, nombre: true } },
      detalles: { include: { producto: true } },
      facturas: true,
      grupoPago: true,
    },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  return pedido;
};

export const crear = async (data) => {
  const items = await Promise.all(
    data.items.map(async (item) => {
      const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
      if (!producto) throw crearError(404, `Producto ${item.productoId} no encontrado`);
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precio: producto.precio,
        nota: item.nota || null,
      };
    })
  );

  const pedido = await prisma.pedido.create({
    data: {
      mesaId: data.mesaId,
      meseroId: data.meseroId,
      estado: ESTADOS_PEDIDO.RECIBIDO,
      detalles: { create: items },
    },
    include: {
      mesa: true,
      mesero: { select: { id: true, nombre: true } },
      detalles: { include: { producto: true } },
    },
  });

  await prisma.mesa.update({
    where: { id: data.mesaId },
    data: { estado: "OCUPADA" },
  });

  return pedido;
};

export const cambiarEstado = async (id, nuevoEstado, motivoCancelacion) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const transicionesValidas = {
    [ESTADOS_PEDIDO.RECIBIDO]: [ESTADOS_PEDIDO.EN_PROCESO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.EN_PROCESO]: [ESTADOS_PEDIDO.ESPERA_PAGO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.ESPERA_PAGO]: [ESTADOS_PEDIDO.PAGADO],
    [ESTADOS_PEDIDO.PAGADO]: [],
    [ESTADOS_PEDIDO.CANCELADO]: [],
  };

  if (!transicionesValidas[pedido.estado].includes(nuevoEstado)) {
    throw crearError(400, `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
  }

  const updateData = { estado: nuevoEstado };
  if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) {
    updateData.motivoCancelacion = motivoCancelacion || null;
  }

  return prisma.pedido.update({
    where: { id },
    data: updateData,
    include: {
      mesa: true,
      detalles: { include: { producto: true } },
    },
  });
};

export const completarDetalle = async (detalleId) => {
  const detalle = await prisma.detallePedido.findUnique({
    where: { id: detalleId },
    include: { pedido: true },
  });
  if (!detalle) throw crearError(404, "Detalle no encontrado");
  if (detalle.pedido.estado !== ESTADOS_PEDIDO.EN_PROCESO) {
    throw crearError(400, "El pedido no está en proceso");
  }

  return prisma.detallePedido.update({
    where: { id: detalleId },
    data: { completado: true },
    include: { producto: true },
  });
};

export const fusionarPedidos = async (pedidoIds) => {
  const pedidos = await prisma.pedido.findMany({
    where: { id: { in: pedidoIds } },
    include: { detalles: true },
  });

  if (pedidos.length !== pedidoIds.length) {
    throw crearError(404, "Algunos pedidos no existen");
  }

  const mesaId = pedidos[0].mesaId;
  for (const p of pedidos) {
    if (p.mesaId !== mesaId) {
      throw crearError(400, "Los pedidos deben ser de la misma mesa");
    }
    if (p.estado !== ESTADOS_PEDIDO.ESPERA_PAGO) {
      throw crearError(400, `El pedido ${p.id} no está en espera de pago`);
    }
  }

  let total = 0;
  for (const p of pedidos) {
    for (const d of p.detalles) {
      total += d.cantidad * d.precio;
    }
  }

  const grupoPago = await prisma.grupoPago.create({
    data: {
      mesaId,
      total,
      pedidos: { connect: pedidos.map((p) => ({ id: p.id })) },
    },
  });

  return prisma.grupoPago.findUnique({
    where: { id: grupoPago.id },
    include: {
      pedidos: { include: { detalles: { include: { producto: true } }, mesa: true } },
    },
  });
};

export const cancelar = async (id, motivoCancelacion) => {
  return cambiarEstado(id, ESTADOS_PEDIDO.CANCELADO, motivoCancelacion);
};

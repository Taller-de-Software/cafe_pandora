import prisma from "../../config/db.config.js";
import { ESTADOS_PEDIDO, TIPOS_FACTURA } from "../../config/constants.js";
import { generarNumeroFactura } from "../../utils/factura.generator.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listar = async (filters = {}) => {
  const where = {};
  if (filters.pedidoId) where.pedidoId = filters.pedidoId;
  if (filters.tipo) where.tipo = filters.tipo;

  return prisma.factura.findMany({
    where,
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
    orderBy: { createdAt: "desc" },
  });
};

export const obtener = async (id) => {
  const factura = await prisma.factura.findUnique({
    where: { id },
    include: {
      pedido: {
        include: {
          mesa: true,
          mesero: { select: { id: true, nombre: true } },
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
  return factura;
};

export const generarFacturaCocina = async (pedidoId) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { detalles: { include: { producto: true } }, mesa: true },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado !== ESTADOS_PEDIDO.RECIBIDO) {
    throw crearError(400, "El pedido debe estar en estado RECIBIDO");
  }

  const numero = await generarNumeroFactura();

  const factura = await prisma.factura.create({
    data: { pedidoId, tipo: TIPOS_FACTURA.COCINA, numero },
  });

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: ESTADOS_PEDIDO.EN_PROCESO },
  });

  return prisma.factura.findUnique({
    where: { id: factura.id },
    include: {
      pedido: {
        include: { detalles: { include: { producto: true } }, mesa: true },
      },
    },
  });
};

export const generarFacturaPago = async (pedidoId) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { detalles: { include: { producto: true } }, mesa: true },
  });

  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado !== ESTADOS_PEDIDO.ESPERA_PAGO) {
    throw crearError(400, "El pedido debe estar en espera de pago");
  }

  const total = pedido.detalles.reduce((sum, d) => sum + d.cantidad * d.precio, 0);
  const numero = await generarNumeroFactura();

  const factura = await prisma.factura.create({
    data: { pedidoId, tipo: TIPOS_FACTURA.PAGO, numero, total },
  });

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { estado: ESTADOS_PEDIDO.PAGADO },
  });

  const mesaId = pedido.mesaId;
  const pedidosActivos = await prisma.pedido.count({
    where: { mesaId, estado: { notIn: ["PAGADO", "CANCELADO"] } },
  });
  if (pedidosActivos === 0) {
    await prisma.mesa.update({
      where: { id: mesaId },
      data: { estado: "DISPONIBLE" },
    });
  }

  return prisma.factura.findUnique({
    where: { id: factura.id },
    include: {
      pedido: {
        include: { detalles: { include: { producto: true } }, mesa: true },
      },
    },
  });
};

export const generarFacturaGrupoPago = async (grupoId) => {
  const grupo = await prisma.grupoPago.findUnique({
    where: { id: grupoId },
    include: {
      pedidos: { include: { detalles: { include: { producto: true } }, mesa: true } },
    },
  });

  if (!grupo) throw crearError(404, "Grupo de pago no encontrado");

  const numero = await generarNumeroFactura();

  const factura = await prisma.factura.create({
    data: {
      pedidoId: grupo.pedidos[0].id,
      tipo: TIPOS_FACTURA.PAGO,
      numero,
      total: grupo.total,
      grupoPagoId: grupoId,
    },
  });

  for (const pedido of grupo.pedidos) {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { estado: ESTADOS_PEDIDO.PAGADO },
    });
  }

  await prisma.mesa.update({
    where: { id: grupo.mesaId },
    data: { estado: "DISPONIBLE" },
  });

  return prisma.factura.findUnique({
    where: { id: factura.id },
    include: {
      grupoPago: {
        include: {
          pedidos: {
            include: { detalles: { include: { producto: true } }, mesa: true },
          },
        },
      },
    },
  });
};

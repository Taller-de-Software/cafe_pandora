import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const ESTADOS_ACTIVOS = ["recibido", "pendiente", "hecho", "finalizado"];
const ESTADOS_NO_CANCELADOS = ["recibido", "pendiente", "hecho", "finalizado"];

const mesaInclude = {
  _count: { select: { pedidos: { where: { estado: { in: ESTADOS_ACTIVOS } } } } },
  pedidos: {
    where: { estado: { in: ESTADOS_NO_CANCELADOS } },
    orderBy: { creadoEn: "desc" },
    take: 1,
    include: {
      detalles: { include: { producto: true } },
      factura: true,
    },
  },
  reservas: {
    where: { estado: { in: ["pendiente", "confirmada"] } },
    orderBy: { creadoEn: "desc" },
    take: 1,
  },
};

export const listar = async () => {
  const mesas = await prisma.mesa.findMany({
    orderBy: { nombre: "asc" },
    include: mesaInclude,
  });

  return mesas.map((m) => ({
    id: m.id,
    nombre: m.nombre,
    ubicacion: m.ubicacion,
    estado: m.estado,
    personalizada: m.personalizada,
    capacidad: m.capacidad,
    pedidoActivo: m.pedidos[0] || null,
    reserva: m.reservas[0] || null,
  }));
};

export const obtener = async (id) => {
  const mesa = await prisma.mesa.findUnique({
    where: { id },
    include: mesaInclude,
  });
  if (!mesa) throw crearError(404, "Mesa no encontrada");

  return {
    id: mesa.id,
    nombre: mesa.nombre,
    ubicacion: mesa.ubicacion,
    estado: mesa.estado,
    personalizada: mesa.personalizada,
    capacidad: mesa.capacidad,
    pedidoActivo: mesa.pedidos[0] || null,
    reserva: mesa.reservas[0] || null,
  };
};

export const crear = async (data) => {
  return prisma.mesa.create({ data });
};

export const actualizar = async (id, data) => {
  return prisma.mesa.update({ where: { id }, data });
};

export const eliminar = async (id) => {
  const pedidos = await prisma.pedido.count({
    where: { mesaId: id, estado: { notIn: ["finalizado", "cancelado"] } },
  });
  if (pedidos > 0) {
    throw crearError(400, "No se puede eliminar: mesa con pedidos activos");
  }
  return prisma.mesa.delete({ where: { id } });
};

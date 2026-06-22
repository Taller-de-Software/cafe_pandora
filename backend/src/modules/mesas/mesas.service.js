import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listar = async () => {
  return prisma.mesa.findMany({
    orderBy: { numero: "asc" },
    include: {
      _count: { select: { pedidos: { where: { estado: { notIn: ["PAGADO", "CANCELADO"] } } } } },
    },
  });
};

export const obtener = async (id) => {
  const mesa = await prisma.mesa.findUnique({ where: { id } });
  if (!mesa) throw crearError(404, "Mesa no encontrada");
  return mesa;
};

export const crear = async (numero) => {
  const existe = await prisma.mesa.findUnique({ where: { numero } });
  if (existe) throw crearError(400, "El número de mesa ya existe");
  return prisma.mesa.create({ data: { numero } });
};

export const actualizar = async (id, data) => {
  return prisma.mesa.update({ where: { id }, data });
};

export const eliminar = async (id) => {
  return prisma.mesa.delete({ where: { id } });
};

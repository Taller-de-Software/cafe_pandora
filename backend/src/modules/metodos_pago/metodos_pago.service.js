import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listar = async () => {
  return prisma.metodoPago.findMany({ orderBy: { nombre: "asc" } });
};

export const obtener = async (id) => {
  const metodo = await prisma.metodoPago.findUnique({ where: { id } });
  if (!metodo) throw crearError(404, "Método de pago no encontrado");
  return metodo;
};

export const crear = async (data) => {
  return prisma.metodoPago.create({ data });
};

export const actualizar = async (id, data) => {
  return prisma.metodoPago.update({ where: { id }, data });
};

export const eliminar = async (id) => {
  return prisma.metodoPago.delete({ where: { id } });
};

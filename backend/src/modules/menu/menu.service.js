import prisma from "../../config/db.config.js";

export const listar = async () => {
  return prisma.menu.findMany();
}

export const obtener = async (id) => {
  return prisma.menu.findUnique({ where: { id } });
}

export const crear = async (data) => {
  return prisma.menu.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.menu.update({ where: { id }, data });
}

export const eliminar = async (id) => {
  return prisma.menu.delete({ where: { id } });
}

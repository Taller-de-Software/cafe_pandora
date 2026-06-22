import prisma from "../../config/db.config.js";

export const listar = async () => {
  return prisma.mesa.findMany();
}

export const obtener = async (id) => {
  return prisma.mesa.findUnique({ where: { id } });
}

export const crear = async (data) => {
  return prisma.mesa.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.mesa.update({ where: { id }, data });
}

export const eliminar = async (id) => {
  return prisma.mesa.delete({ where: { id } });
}

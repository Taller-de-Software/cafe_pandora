export const listar = async () => {
  return prisma.impresion.findMany();
}

export const obtener = async (id) => {
  return prisma.impresion.findUnique({ where: { id } });
}

export const crear = async (data) => {
  return prisma.impresion.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.impresion.update({ where: { id }, data });
}

export const eliminar = async (id) => {
  return prisma.impresion.delete({ where: { id } });
}

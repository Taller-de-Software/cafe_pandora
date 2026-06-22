export const listar = async () => {
  return prisma.factura.findMany();
}

export const obtener = async (id) => {
  return prisma.factura.findUnique({ where: { id } });
}

export const crear = async (data) => {
  return prisma.factura.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.factura.update({ where: { id }, data });
}

export const eliminar = async (id) => {
  return prisma.factura.delete({ where: { id } });
}

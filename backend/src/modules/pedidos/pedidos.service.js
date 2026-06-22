export const listar = async () => {
  return prisma.pedido.findMany();
}

export const obtener = async (id) => {
  return prisma.pedido.findUnique({ where: { id } });
}

export const crear = async (data) => {
  return prisma.pedido.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.pedido.update({ where: { id }, data });
}

export const eliminar = async (id) => {
  return prisma.pedido.delete({ where: { id } });
}

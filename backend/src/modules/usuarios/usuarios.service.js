export const listar = async () => {
  return prisma.usuario.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export const obtener = async (id) => {
  return prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
}

export const crear = async (data) => {
  return prisma.usuario.create({ data });
}

export const actualizar = async (id, data) => {
  return prisma.usuario.update({
    where: { id },
    data,
  });
}

export const eliminar = async (id) => {
  return prisma.usuario.delete({ where: { id } });
}

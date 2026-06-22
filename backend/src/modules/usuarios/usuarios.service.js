import prisma from "../../config/db.config.js";
import { hashPassword } from "../../utils/hash.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const usuarioSelect = { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true };

export const listar = async () => {
  return prisma.usuario.findMany({ select: usuarioSelect });
};

export const obtener = async (id) => {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
};

export const crear = async (data) => {
  const password = await hashPassword(data.password);
  return prisma.usuario.create({
    data: { ...data, password },
    select: usuarioSelect,
  });
};

export const actualizar = async (id, data) => {
  const updateData = {};
  if (data.nombre) updateData.nombre = data.nombre;
  if (data.email) updateData.email = data.email;
  if (data.rol) updateData.rol = data.rol;
  if (data.activo !== undefined) updateData.activo = data.activo;
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  return prisma.usuario.update({
    where: { id },
    data: updateData,
    select: usuarioSelect,
  });
};

export const eliminar = async (id) => {
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
  });
};

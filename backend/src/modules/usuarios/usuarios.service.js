import prisma from "../../config/db.config.js";
import { hashPassword } from "../../utils/hash.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const usuarioSelect = { id: true, nombre: true, rol: true };

export const listar = async () => {
  return prisma.usuario.findMany({ select: usuarioSelect });
};

export const obtener = async (id) => {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: usuarioSelect });
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
};

export const crear = async (data) => {
  const createData = { nombre: data.nombre };
  if (data.pin) {
    createData.pin = await hashPassword(data.pin);
  }
  return prisma.usuario.create({
    data: { rol: data.rol, ...createData },
    select: usuarioSelect,
  });
};

export const actualizar = async (id, data) => {
  const updateData = {};
  if (data.nombre) updateData.nombre = data.nombre;
  if (data.pin) {
    updateData.pin = await hashPassword(data.pin);
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
  return prisma.usuario.delete({ where: { id } });
};

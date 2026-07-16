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
  const existingNombre = await prisma.usuario.findUnique({ where: { nombre: data.nombre } });
  if (existingNombre) throw crearError(409, "Ya existe un usuario con ese nombre");

  const createData = { nombre: data.nombre, rol: data.rol };
  if (data.pin) {
    createData.pin = await hashPassword(data.pin);
  }
  return prisma.usuario.create({
    data: createData,
    select: usuarioSelect,
  });
};

export const actualizar = async (id, data) => {
  const updateData = {};
  if (data.nombre) {
    const existing = await prisma.usuario.findFirst({ where: { nombre: data.nombre, id: { not: id } } });
    if (existing) throw crearError(409, "Ya existe un usuario con ese nombre");
    updateData.nombre = data.nombre;
  }
  if (data.rol) {
    updateData.rol = data.rol;
  }
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

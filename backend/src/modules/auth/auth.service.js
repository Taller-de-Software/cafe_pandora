import prisma from "../../config/db.config.js";
import crypto from "crypto";
import { comparePassword } from "../../utils/hash.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { REFRESH_TOKEN_DIAS_VALIDO } from "../../config/constants.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function guardarRefreshToken(usuarioId) {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DIAS_VALIDO);

  await prisma.refreshToken.create({
    data: { token, usuarioId, expiresAt },
  });

  return token;
}

export const login = async ({ email, password }) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo) throw crearError(401, "Credenciales inválidas");

  const valida = await comparePassword(password, usuario.password);
  if (!valida) throw crearError(401, "Credenciales inválidas");

  const payload = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await guardarRefreshToken(usuario.id);

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
  };
};

export const refresh = async (token) => {
  if (!token) throw crearError(400, "Refresh token requerido");

  const stored = await prisma.refreshToken.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!stored || stored.expiresAt < new Date() || !stored.usuario.activo) {
    if (stored) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
    }
    throw crearError(401, "Refresh token inválido o expirado");
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const payload = {
    id: stored.usuario.id,
    nombre: stored.usuario.nombre,
    email: stored.usuario.email,
    rol: stored.usuario.rol,
  };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = await guardarRefreshToken(stored.usuario.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    usuario: payload,
  };
};

export const logout = async (token) => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
};

export const getMe = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
  });
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
};

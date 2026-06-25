import prisma from "../../config/db.config.js";
import { comparePassword } from "../../utils/hash.js";
import { generateAccessToken } from "../../utils/jwt.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const login = async ({ rol, pin }) => {
  const usuario = await prisma.usuario.findUnique({ where: { rol } });
  if (!usuario) throw crearError(401, "Credenciales inválidas");

  if (usuario.rol === "administrador") {
    if (!pin) throw crearError(400, "PIN requerido para administrador");
    const valida = await comparePassword(pin, usuario.pin);
    if (!valida) throw crearError(401, "PIN inválido");
  }

  const payload = { id: usuario.id, rol: usuario.rol };
  const accessToken = generateAccessToken(payload);

  return {
    accessToken,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
    },
  };
};

export const getMe = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, nombre: true, rol: true },
  });
  if (!usuario) throw crearError(404, "Usuario no encontrado");
  return usuario;
};

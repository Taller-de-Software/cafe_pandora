import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listarSesiones = async () => {
  return prisma.cajaSesion.findMany({
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
      _count: { select: { retiros: true } },
    },
    orderBy: { apertura: "desc" },
  });
};

export const obtenerSesion = async (id) => {
  const sesion = await prisma.cajaSesion.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
      retiros: { include: { usuario: { select: { id: true, nombre: true, rol: true } } } },
    },
  });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  return sesion;
};

export const obtenerSesionActiva = async () => {
  const sesion = await prisma.cajaSesion.findFirst({
    where: { cierre: null },
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
      retiros: { include: { usuario: { select: { id: true, nombre: true, rol: true } } } },
    },
    orderBy: { apertura: "desc" },
  });
  return sesion;
};

export const apertura = async (baseInicial, usuarioId) => {
  const activa = await prisma.cajaSesion.findFirst({ where: { cierre: null } });
  if (activa) throw crearError(400, "Ya hay una sesión de caja activa");

  return prisma.cajaSesion.create({
    data: {
      baseInicial,
      totalEnCaja: baseInicial,
      usuarioId,
    },
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
    },
  });
};

export const cierre = async (id, usuarioId) => {
  const sesion = await prisma.cajaSesion.findUnique({
    where: { id },
    include: { retiros: true },
  });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  if (sesion.cierre) throw crearError(400, "La sesión ya está cerrada");

  const totalEgresos = sesion.retiros.reduce((sum, r) => sum + r.monto, 0);
  const netoCajon = sesion.baseInicial + sesion.totalVentas - totalEgresos;

  return prisma.cajaSesion.update({
    where: { id },
    data: {
      cierre: new Date(),
      totalEgresos,
      netoCajon,
    },
    include: {
      usuario: { select: { id: true, nombre: true, rol: true } },
      retiros: { include: { usuario: { select: { id: true, nombre: true, rol: true } } } },
    },
  });
};

export const listarRetiros = async (cajaSesionId) => {
  return prisma.retiroCaja.findMany({
    where: { cajaSesionId },
    include: { usuario: { select: { id: true, nombre: true, rol: true } } },
    orderBy: { retiradoEn: "desc" },
  });
};

export const crearRetiro = async (cajaSesionId, data, usuarioId) => {
  const sesion = await prisma.cajaSesion.findUnique({ where: { id: cajaSesionId } });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  if (sesion.cierre) throw crearError(400, "La sesión ya está cerrada");

  const retiro = await prisma.retiroCaja.create({
    data: {
      descripcion: data.descripcion,
      categoria: data.categoria || "otro",
      monto: data.monto,
      cajaSesionId,
      usuarioId,
    },
    include: { usuario: { select: { id: true, nombre: true, rol: true } } },
  });

  await prisma.cajaSesion.update({
    where: { id: cajaSesionId },
    data: {
      totalEgresos: { increment: data.monto },
      totalEnCaja: { decrement: data.monto },
    },
  });

  return retiro;
};

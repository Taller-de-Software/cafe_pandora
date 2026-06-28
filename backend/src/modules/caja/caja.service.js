import prisma from "../../config/db.config.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export const listarSesiones = async () => {
  return prisma.cajaSesion.findMany({
    include: {
      _count: { select: { retiros: true } },
    },
    orderBy: { apertura: "desc" },
  });
};

export const obtenerSesion = async (id) => {
  const sesion = await prisma.cajaSesion.findUnique({
    where: { id },
    include: { retiros: true },
  });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  return sesion;
};

export const obtenerSesionActiva = async () => {
  const sesion = await prisma.cajaSesion.findFirst({
    where: { cierre: null },
    include: { retiros: true },
    orderBy: { apertura: "desc" },
  });
  return sesion;
};

export const apertura = async (baseInicial) => {
  const activa = await prisma.cajaSesion.findFirst({ where: { cierre: null } });
  if (activa) throw crearError(400, "Ya hay una sesión de caja activa");

  return prisma.cajaSesion.create({
    data: {
      baseInicial,
      totalEnCaja: baseInicial,
    },
  });
};

export const cierre = async (id) => {
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
    include: { retiros: true },
  });
};

export const listarRetiros = async (cajaSesionId) => {
  return prisma.retiroCaja.findMany({
    where: { cajaSesionId },
    orderBy: { retiradoEn: "desc" },
  });
};

export const crearRetiro = async (cajaSesionId, data) => {
  const sesion = await prisma.cajaSesion.findUnique({ where: { id: cajaSesionId } });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  if (sesion.cierre) throw crearError(400, "La sesión ya está cerrada");

  const retiro = await prisma.retiroCaja.create({
    data: {
      tipo: data.tipo,
      monto: data.monto,
      cajaSesionId,
    },
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

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
    include: {
      retiros: true,
      facturas: {
        include: { metodoPago: true },
      },
    },
  });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");
  if (sesion.cierre) throw crearError(400, "La sesión ya está cerrada");

  const totalEntradas = sesion.retiros
    .filter((r) => r.tipo === "entrada")
    .reduce((sum, r) => sum + r.monto, 0);
  const totalEgresos = sesion.retiros
    .filter((r) => r.tipo === "salida")
    .reduce((sum, r) => sum + r.monto, 0);
  const netoCajon = sesion.baseInicial + sesion.totalVentas + totalEntradas - totalEgresos;

  const sesionActualizada = await prisma.cajaSesion.update({
    where: { id },
    data: {
      cierre: new Date(),
      totalEgresos,
      netoCajon,
    },
    include: { retiros: true },
  });

  const desglosePorMetodoPago = {};
  for (const f of sesion.facturas) {
    const nombre = f.metodoPago.nombre;
    if (!desglosePorMetodoPago[nombre]) {
      desglosePorMetodoPago[nombre] = { count: 0, total: 0 };
    }
    desglosePorMetodoPago[nombre].count += 1;
    desglosePorMetodoPago[nombre].total += f.total;
  }

  return {
    sesion: sesionActualizada,
    resumen: {
      cantidadFacturas: sesion.facturas.length,
      sumaTotal: sesion.facturas.reduce((s, f) => s + f.total, 0),
      desglosePorMetodoPago,
    },
  };
};

export const resumenSesion = async (id) => {
  const sesion = await prisma.cajaSesion.findUnique({
    where: { id },
    include: {
      retiros: { orderBy: { retiradoEn: "asc" } },
      facturas: {
        include: {
          metodoPago: true,
          pedido: {
            include: {
              mesa: true,
              detalles: { include: { producto: true } },
            },
          },
        },
        orderBy: { creadoEn: "desc" },
      },
    },
  });
  if (!sesion) throw crearError(404, "Sesión de caja no encontrada");

  const totalFacturas = sesion.facturas.length;
  const sumaTotal = sesion.facturas.reduce((s, f) => s + f.total, 0);

  const desglosePorMetodoPago = {};
  for (const f of sesion.facturas) {
    const nombre = f.metodoPago.nombre;
    if (!desglosePorMetodoPago[nombre]) {
      desglosePorMetodoPago[nombre] = { count: 0, total: 0 };
    }
    desglosePorMetodoPago[nombre].count += 1;
    desglosePorMetodoPago[nombre].total += f.total;
  }

  const totalEntradasRetiros = sesion.retiros
    .filter((r) => r.tipo === "entrada")
    .reduce((s, r) => s + r.monto, 0);
  const totalSalidasRetiros = sesion.retiros
    .filter((r) => r.tipo === "salida")
    .reduce((s, r) => s + r.monto, 0);

  return {
    sesion: {
      id: sesion.id,
      apertura: sesion.apertura,
      cierre: sesion.cierre,
      baseInicial: sesion.baseInicial,
      totalVentas: sesion.totalVentas,
      totalEgresos: sesion.totalEgresos,
      totalEnCaja: sesion.totalEnCaja,
      netoCajon: sesion.netoCajon,
      estaAbierta: sesion.cierre === null,
    },
    resumen: {
      cantidadFacturas: totalFacturas,
      sumaTotal,
      desglosePorMetodoPago,
      totalEntradasRetiros,
      totalSalidasRetiros,
      balanceEsperado: sesion.baseInicial + sumaTotal + totalEntradasRetiros - totalSalidasRetiros,
    },
    facturas: sesion.facturas.map((f) => ({
      id: f.id,
      total: f.total,
      subtotal: f.subtotal,
      impuestoConsumo: f.impuestoConsumo,
      creadoEn: f.creadoEn,
      metodoPago: f.metodoPago.nombre,
      pedido: {
        id: f.pedido.id,
        mesa: f.pedido.mesa?.nombre ?? "Sin mesa",
        estado: f.pedido.estado,
        detalles: f.pedido.detalles.map((d) => ({
          producto: d.producto.nombre,
          cantidad: d.cantidad,
          precio: d.precioUnitario,
        })),
      },
    })),
    retiros: sesion.retiros,
  };
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

  const retiro = await prisma.$transaction(async (tx) => {
    const r = await tx.retiroCaja.create({
      data: {
        tipo: data.tipo,
        monto: data.monto,
        cajaSesionId,
      },
    });

    const updateData = data.tipo === "entrada"
      ? { totalEnCaja: { increment: data.monto } }
      : { totalEgresos: { increment: data.monto }, totalEnCaja: { decrement: data.monto } };

    await tx.cajaSesion.update({
      where: { id: cajaSesionId },
      data: updateData,
    });

    return r;
  });

  return retiro;
};

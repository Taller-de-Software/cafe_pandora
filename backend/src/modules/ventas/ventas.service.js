import prisma from "../../config/db.config.js";

function inicioDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inicioDeSemana(fecha = new Date()) {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inicioDeMes(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function finDelDia(fecha = new Date()) {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function obtenerVentas(desde, hasta) {
  const facturas = await prisma.factura.findMany({
    where: {
      creadoEn: { gte: desde, lte: hasta },
    },
    include: {
      pedido: {
        include: {
          mesa: true,
          detalles: { include: { producto: true } },
        },
      },
    },
    orderBy: { creadoEn: "desc" },
  });

  const resumen = facturas.reduce(
    (acc, f) => ({
      total: acc.total + f.total,
      cantidadPedidos: acc.cantidadPedidos + 1,
    }),
    { total: 0, cantidadPedidos: 0 }
  );

  const pedidos = facturas.map((f) => ({
    id: f.pedido.id,
    total: f.total,
    mesa: f.pedido.mesa?.nombre ?? "Sin mesa",
    estado: f.pedido.estado,
    creadoEn: f.creadoEn,
    detalles: f.pedido.detalles.map((d) => ({
      producto: d.producto.nombre,
      cantidad: d.cantidad,
      precio: d.precioUnitario,
    })),
  }));

  return { resumen, pedidos };
}

export const dia = () => {
  const ahora = new Date();
  return obtenerVentas(inicioDelDia(ahora), finDelDia(ahora));
};

export const semana = () => {
  const ahora = new Date();
  return obtenerVentas(inicioDeSemana(ahora), finDelDia(ahora));
};

export const mes = () => {
  const ahora = new Date();
  return obtenerVentas(inicioDeMes(ahora), finDelDia(ahora));
};

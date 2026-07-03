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
      metodoPago: true,
      pedido: {
        include: {
          mesa: true,
          detalles: {
            include: {
              producto: { include: { categoria: true } },
            },
          },
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

  const itemsVendidos = facturas.reduce((acc, f) => {
    const suma = f.pedido.detalles.reduce((s, d) => s + d.cantidad, 0);
    return acc + suma;
  }, 0);

  const ticketPromedio =
    resumen.cantidadPedidos > 0
      ? resumen.total / resumen.cantidadPedidos
      : 0;

  const ventasPorCategoria = new Map();
  const conteoProductos = new Map();

  for (const f of facturas) {
    for (const d of f.pedido.detalles) {
      const catNombre = d.producto.categoria?.nombre ?? "Sin categoría";
      const actual = ventasPorCategoria.get(catNombre) ?? {
        categoria: catNombre,
        total: 0,
        cantidad: 0,
      };
      actual.total += d.precioUnitario * d.cantidad;
      actual.cantidad += d.cantidad;
      ventasPorCategoria.set(catNombre, actual);

      const prodActual = conteoProductos.get(d.producto.nombre) ?? {
        producto: d.producto.nombre,
        cantidad: 0,
        total: 0,
      };
      prodActual.cantidad += d.cantidad;
      prodActual.total += d.precioUnitario * d.cantidad;
      conteoProductos.set(d.producto.nombre, prodActual);
    }
  }

  const porCategoria = Array.from(ventasPorCategoria.values()).sort(
    (a, b) => b.total - a.total
  );

  const productosMasVendidos = Array.from(conteoProductos.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10);

  const pedidos = facturas.map((f) => ({
    id: f.pedido.id,
    total: f.total,
    mesa: f.pedido.mesa?.nombre ?? "Sin mesa",
    metodoPago: f.metodoPago?.nombre ?? "Desconocido",
    estado: f.pedido.estado,
    creadoEn: f.creadoEn,
    detalles: f.pedido.detalles.map((d) => ({
      producto: d.producto.nombre,
      cantidad: d.cantidad,
      precio: d.precioUnitario,
    })),
  }));

  return {
    resumen: {
      total: resumen.total,
      cantidadPedidos: resumen.cantidadPedidos,
      ticketPromedio,
      itemsVendidos,
    },
    porCategoria,
    productosMasVendidos,
    pedidos,
  };
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

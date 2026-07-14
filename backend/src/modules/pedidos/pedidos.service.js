import prisma from "../../config/db.config.js";
import { ESTADOS_PEDIDO, ESTADOS_MESA } from "../../config/constants.js";

function crearError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const pedidoInclude = {
  mesa: true,
  usuario: { select: { id: true, nombre: true, rol: true } },
  detalles: { include: { producto: true } },
  factura: true,
  abonos: true,
};

export const listar = async (filters = {}) => {
  const where = {};
  if (filters.estado) where.estado = filters.estado;
  if (filters.mesaId) where.mesaId = filters.mesaId;

  return prisma.pedido.findMany({
    where,
    include: pedidoInclude,
    orderBy: { creadoEn: "desc" },
  });
};

export const obtener = async (id) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: pedidoInclude,
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  return pedido;
};

async function calcularTurno(tx) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const count = await tx.pedido.count({
    where: { creadoEn: { gte: hoy, lt: manana } },
  });
  return count + 1;
}

export const crear = async (data, usuarioId) => {
  const items = await Promise.all(
    data.items.map(async (item) => {
      const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
      if (!producto) throw crearError(404, `Producto ${item.productoId} no encontrado`);
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas || null,
      };
    })
  );

  const totalItems = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);

  const pedido = await prisma.$transaction(async (tx) => {
    const turno = data.turno || await calcularTurno(tx);

    const p = await tx.pedido.create({
      data: {
        turno,
        mesaId: data.mesaId,
        mesaOrigenId: data.mesaOrigenId || null,
        usuarioId,
        total: totalItems,
        estado: ESTADOS_PEDIDO.RECIBIDO,
        detalles: { create: items },
      },
      include: pedidoInclude,
    });

    await tx.mesa.update({
      where: { id: data.mesaId },
      data: { estado: ESTADOS_MESA.OCUPADA },
    });

    return p;
  });

  return pedido;
};

export const cambiarEstado = async (id, nuevoEstado) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { mesa: true },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const transicionesValidas = {
    [ESTADOS_PEDIDO.RECIBIDO]: [ESTADOS_PEDIDO.PENDIENTE, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.PENDIENTE]: [ESTADOS_PEDIDO.HECHO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.HECHO]: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO],
    [ESTADOS_PEDIDO.FINALIZADO]: [],
    [ESTADOS_PEDIDO.CANCELADO]: [],
  };

  if (!transicionesValidas[pedido.estado]?.includes(nuevoEstado)) {
    throw crearError(400, `No se puede cambiar de ${pedido.estado} a ${nuevoEstado}`);
  }

  const timestamps = {};
  if (nuevoEstado === ESTADOS_PEDIDO.PENDIENTE) timestamps.pendienteEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.HECHO) timestamps.hechoEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.FINALIZADO) timestamps.finalizadoEn = new Date();
  if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) timestamps.canceladoEn = new Date();

  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.update({
      where: { id },
      data: { estado: nuevoEstado, ...timestamps },
      include: pedidoInclude,
    });

    if (nuevoEstado === ESTADOS_PEDIDO.FINALIZADO) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: ESTADOS_MESA.POR_PAGAR },
      });
    }

    if (nuevoEstado === ESTADOS_PEDIDO.CANCELADO) {
      const activos = await tx.pedido.count({
        where: {
          mesaId: pedido.mesaId,
          id: { not: id },
          estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] },
        },
      });
      if (activos === 0) {
        await tx.mesa.update({
          where: { id: pedido.mesaId },
          data: { estado: ESTADOS_MESA.VACIA },
        });
      }
    }

    return p;
  });
};

export const cancelar = async (id) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede cancelar un pedido en estado ${pedido.estado}`);
  }

  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.update({
      where: { id },
      data: { estado: ESTADOS_PEDIDO.CANCELADO, canceladoEn: new Date() },
      include: pedidoInclude,
    });

    const activos = await tx.pedido.count({
      where: {
        mesaId: pedido.mesaId,
        id: { not: id },
        estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] },
      },
    });
    if (activos === 0) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: ESTADOS_MESA.VACIA },
      });
    }

    return p;
  });
};

export const actualizarItems = async (id, itemsData, nuevoEstado) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede modificar un pedido en estado ${pedido.estado}`);
  }

  const items = await Promise.all(
    itemsData.map(async (item) => {
      const producto = await prisma.producto.findUnique({ where: { id: item.productoId } });
      if (!producto) throw crearError(404, `Producto ${item.productoId} no encontrado`);
      return {
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas || null,
      };
    })
  );

  const totalItems = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);

  const timestamps = {};
  if (nuevoEstado === ESTADOS_PEDIDO.PENDIENTE) timestamps.pendienteEn = new Date();

  return prisma.$transaction(async (tx) => {
    await tx.detallePedido.deleteMany({ where: { pedidoId: id } });

    for (const item of items) {
      await tx.detallePedido.create({
        data: { pedidoId: id, ...item },
      });
    }

    const updateData = { total: totalItems };
    if (nuevoEstado) updateData.estado = nuevoEstado;
    Object.assign(updateData, timestamps);

    const p = await tx.pedido.update({
      where: { id },
      data: updateData,
      include: pedidoInclude,
    });

    return p;
  });
};

export const separarCuenta = async (id, cuentasData) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { detalles: true },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede separar la cuenta de un pedido en estado ${pedido.estado}`);
  }
  if (cuentasData.length < 2) {
    throw crearError(400, "Se requieren al menos 2 cuentas");
  }

  return prisma.$transaction(async (tx) => {
    const turno = pedido.turno;

    const primeraCuentaItems = cuentasData[0];
    const primeraTotal = await recalcularPedido(tx, id, primeraCuentaItems);

    const nuevosPedidos = [];
    for (let i = 1; i < cuentasData.length; i++) {
      const cuentaItems = cuentasData[i];
      const total = cuentaItems.reduce((sum, item) => sum + (item.precioUnitario ?? 0) * item.cantidad, 0);

      const nuevoPedido = await tx.pedido.create({
        data: {
          turno,
          mesaId: pedido.mesaId,
          mesaOrigenId: pedido.mesaOrigenId,
          usuarioId: pedido.usuarioId,
          total,
          estado: ESTADOS_PEDIDO.RECIBIDO,
        },
        include: pedidoInclude,
      });

      for (const item of cuentaItems) {
        await tx.detallePedido.create({
          data: {
            pedidoId: nuevoPedido.id,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario ?? 0,
            notas: item.notas || null,
          },
        });
      }

      nuevosPedidos.push(nuevoPedido);
    }

    const original = await tx.pedido.findUnique({
      where: { id },
      include: pedidoInclude,
    });

    return { original, nuevosPedidos };
  });
};

async function recalcularPedido(tx, pedidoId, itemsData) {
  await tx.detallePedido.deleteMany({ where: { pedidoId } });

  let total = 0;
  for (const item of itemsData) {
    const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
    if (!producto) throw crearError(404, `Producto ${item.productoId} no encontrado`);
    await tx.detallePedido.create({
      data: {
        pedidoId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        notas: item.notas || null,
      },
    });
    total += producto.precio * item.cantidad;
  }

  await tx.pedido.update({
    where: { id: pedidoId },
    data: { total },
  });

  return total;
}

export const unirMesas = async (id, mesaOrigenId) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const mesaOrigen = await prisma.mesa.findUnique({ where: { id: mesaOrigenId } });
  if (!mesaOrigen) throw crearError(404, "Mesa de origen no encontrada");

  if (mesaOrigenId === pedido.mesaId) {
    throw crearError(400, "No se puede unir una mesa consigo misma");
  }

  const pedidoOrigen = await prisma.pedido.findFirst({
    where: {
      mesaId: mesaOrigenId,
      estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] },
    },
  });

  if (!pedidoOrigen) {
    throw crearError(400, "La mesa de origen no tiene pedido activo");
  }

  return prisma.$transaction(async (tx) => {
    await tx.unionMesa.create({
      data: {
        mesaId: mesaOrigenId,
        pedidoId: id,
      },
    });

    const detallesOrigen = await tx.detallePedido.findMany({
      where: { pedidoId: pedidoOrigen.id },
    });

    await tx.detallePedido.deleteMany({ where: { pedidoId: pedidoOrigen.id } });

    for (const detalle of detallesOrigen) {
      const existente = await tx.detallePedido.findFirst({
        where: {
          pedidoId: id,
          productoId: detalle.productoId,
        },
      });

      if (existente) {
        await tx.detallePedido.update({
          where: { id: existente.id },
          data: {
            cantidad: existente.cantidad + detalle.cantidad,
          },
        });
      } else {
        await tx.detallePedido.create({
          data: {
            pedidoId: id,
            productoId: detalle.productoId,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            notas: detalle.notas,
          },
        });
      }
    }

    const totalPedido = await tx.detallePedido.aggregate({
      where: { pedidoId: id },
      _sum: { precioUnitario: true, cantidad: true },
    });

    const detallesActualizados = await tx.detallePedido.findMany({
      where: { pedidoId: id },
    });
    const nuevoTotal = detallesActualizados.reduce(
      (sum, d) => sum + d.precioUnitario * d.cantidad,
      0
    );

    await tx.pedido.update({
      where: { id },
      data: { total: nuevoTotal },
    });

    await tx.pedido.update({
      where: { id: pedidoOrigen.id },
      data: { estado: ESTADOS_PEDIDO.CANCELADO, canceladoEn: new Date() },
    });

    await tx.mesa.update({
      where: { id: mesaOrigenId },
      data: { estado: ESTADOS_MESA.VACIA },
    });

    const pedidoActualizado = await tx.pedido.findUnique({
      where: { id },
      include: pedidoInclude,
    });

    return pedidoActualizado;
  });
};

export const cambiarMesa = async (id, nuevaMesaId) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede cambiar la mesa de un pedido en estado ${pedido.estado}`);
  }

  const nuevaMesa = await prisma.mesa.findUnique({ where: { id: nuevaMesaId } });
  if (!nuevaMesa) throw crearError(404, "Mesa destino no encontrada");
  if (nuevaMesa.estado === ESTADOS_MESA.FUERA_DE_SERVICIO) {
    throw crearError(400, "La mesa está fuera de servicio");
  }

  return prisma.$transaction(async (tx) => {
    const p = await tx.pedido.update({
      where: { id },
      data: {
        mesaOrigenId: pedido.mesaId,
        mesaId: nuevaMesaId,
      },
      include: pedidoInclude,
    });

    const activosEnAntigua = await tx.pedido.count({
      where: {
        mesaId: pedido.mesaId,
        id: { not: id },
        estado: { notIn: [ESTADOS_PEDIDO.FINALIZADO, ESTADOS_PEDIDO.CANCELADO] },
      },
    });
    if (activosEnAntigua === 0) {
      await tx.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: ESTADOS_MESA.VACIA },
      });
    }

    await tx.mesa.update({
      where: { id: nuevaMesaId },
      data: { estado: ESTADOS_MESA.OCUPADA },
    });

    return p;
  });
};

export const registrarAbono = async (id, { monto, metodoPagoId }) => {
  const pedido = await prisma.pedido.findUnique({ where: { id } });
  if (!pedido) throw crearError(404, "Pedido no encontrado");
  if (pedido.estado === ESTADOS_PEDIDO.FINALIZADO || pedido.estado === ESTADOS_PEDIDO.CANCELADO) {
    throw crearError(400, `No se puede abonar un pedido en estado ${pedido.estado}`);
  }

  const metodoPago = await prisma.metodoPago.findUnique({ where: { id: metodoPagoId } });
  if (!metodoPago) throw crearError(404, "Método de pago no encontrado");

  const nuevoTotalAbonado = (pedido.totalAbonado || 0) + monto;
  if (pedido.total && nuevoTotalAbonado > pedido.total) {
    throw crearError(400, "El monto total abonado no puede superar el total del pedido");
  }

  return prisma.$transaction(async (tx) => {
    const abono = await tx.abonoPedido.create({
      data: {
        monto,
        metodoPagoId,
        pedidoId: id,
      },
    });

    const p = await tx.pedido.update({
      where: { id },
      data: { totalAbonado: nuevoTotalAbonado },
      include: pedidoInclude,
    });

    return { abono, pedido: p };
  });
};

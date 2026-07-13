import { z } from "zod";
import * as pedidosService from "./pedidos.service.js";
import { ok, created } from "../../utils/response.js";

const idQuery = z.coerce.number().int().positive().optional();
const estadoQuery = z.string().optional();

function getIO(req) {
  return req.app.get("io");
}

export const listar = async (req, res, next) => {
  try {
    const filters = {};
    const estado = estadoQuery.parse(req.query.estado);
    const mesaId = idQuery.parse(req.query.mesaId);
    if (estado) filters.estado = estado;
    if (mesaId) filters.mesaId = mesaId;
    const pedidos = await pedidosService.listar(filters);
    ok(res, pedidos);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const pedido = await pedidosService.obtener(req.params.id);
    ok(res, pedido);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const pedido = await pedidosService.crear(req.body, req.user.id);

    const io = getIO(req);
    io.to("room:all").emit("pedido:nuevo", pedido);
    io.to("room:all").emit("mesa:actualizada", { mesaId: req.body.mesaId });

    created(res, pedido, "Pedido creado");
  } catch (err) {
    next(err);
  }
};

export const cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const pedido = await pedidosService.cambiarEstado(req.params.id, estado);

    const io = getIO(req);
    io.to("room:all").emit("pedido:estado", {
      pedidoId: pedido.id,
      estado: pedido.estado,
    });

    ok(res, pedido, "Estado actualizado");
  } catch (err) {
    next(err);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const pedido = await pedidosService.cancelar(req.params.id);

    const io = getIO(req);
    io.to("room:all").emit("pedido:estado", {
      pedidoId: pedido.id,
      estado: pedido.estado,
    });

    ok(res, pedido, "Pedido cancelado");
  } catch (err) {
    next(err);
  }
};

export const actualizarItems = async (req, res, next) => {
  try {
    const pedido = await pedidosService.actualizarItems(req.params.id, req.body.items);

    const io = getIO(req);
    io.to("room:all").emit("pedido:actualizado", { pedidoId: pedido.id });

    ok(res, pedido, "Items actualizados");
  } catch (err) {
    next(err);
  }
};

export const separarCuenta = async (req, res, next) => {
  try {
    const resultado = await pedidosService.separarCuenta(req.params.id, req.body.cuentas);

    const io = getIO(req);
    for (const np of resultado.nuevosPedidos) {
      io.to("room:all").emit("pedido:nuevo", np);
    }
    io.to("room:all").emit("pedido:actualizado", { pedidoId: resultado.original.id });

    ok(res, resultado, "Cuenta separada");
  } catch (err) {
    next(err);
  }
};

export const unirMesas = async (req, res, next) => {
  try {
    const pedido = await pedidosService.unirMesas(req.params.id, req.body.mesaOrigenId);

    const io = getIO(req);
    io.to("room:all").emit("pedido:fusionado", { pedidoId: pedido.id });
    io.to("room:all").emit("mesa:actualizada", { mesaId: req.body.mesaOrigenId });

    ok(res, pedido, "Mesas fusionadas");
  } catch (err) {
    next(err);
  }
};

export const cambiarMesa = async (req, res, next) => {
  try {
    const pedido = await pedidosService.cambiarMesa(req.params.id, req.body.mesaId);

    const io = getIO(req);
    io.to("room:all").emit("mesa:actualizada", { mesaId: pedido.mesaId });

    ok(res, pedido, "Mesa cambiada");
  } catch (err) {
    next(err);
  }
};

export const registrarAbono = async (req, res, next) => {
  try {
    const resultado = await pedidosService.registrarAbono(req.params.id, req.body);

    const io = getIO(req);
    io.to("room:all").emit("pedido:abono", { pedidoId: resultado.pedido.id, abono: resultado.abono });

    ok(res, resultado, "Abono registrado");
  } catch (err) {
    next(err);
  }
};

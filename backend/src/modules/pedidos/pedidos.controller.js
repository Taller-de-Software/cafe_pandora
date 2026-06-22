import * as pedidosService from "./pedidos.service.js";
import { ok, created, badRequest } from "../../utils/response.js";

function getIO(req) {
  return req.app.get("io");
}

export const listar = async (req, res, next) => {
  try {
    const { estado, mesaId } = req.query;
    const filters = {};
    if (estado) filters.estado = estado;
    if (mesaId) filters.mesaId = parseInt(mesaId);
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
    const { mesaId, items } = req.body;
    if (!mesaId || !items || !items.length) {
      return badRequest(res, "Mesa e items requeridos");
    }
    const pedido = await pedidosService.crear({
      mesaId,
      meseroId: req.user.id,
      items,
    });

    const io = getIO(req);
    io.to("room:ADMIN").emit("pedido:nuevo", pedido);
    io.to("room:all").emit("mesa:actualizada", { mesaId });

    created(res, pedido, "Pedido creado");
  } catch (err) {
    next(err);
  }
};

export const cambiarEstado = async (req, res, next) => {
  try {
    const { estado, motivoCancelacion } = req.body;
    const pedido = await pedidosService.cambiarEstado(
      req.params.id,
      estado,
      motivoCancelacion
    );

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

export const completarDetalle = async (req, res, next) => {
  try {
    const detalle = await pedidosService.completarDetalle(
      parseInt(req.params.detalleId)
    );

    const io = getIO(req);
    io.to("room:all").emit("detalle:completado", {
      detalleId: detalle.id,
      pedidoId: detalle.pedidoId,
    });

    ok(res, detalle, "Detalle completado");
  } catch (err) {
    next(err);
  }
};

export const fusionarPedidos = async (req, res, next) => {
  try {
    const { pedidoIds } = req.body;
    if (!pedidoIds || pedidoIds.length < 2) {
      return badRequest(res, "Se requieren al menos 2 pedidos para fusionar");
    }
    const result = await pedidosService.fusionarPedidos(pedidoIds);

    const io = getIO(req);
    io.to("room:all").emit("pedido:fusionado", result);

    ok(res, result, "Pedidos fusionados");
  } catch (err) {
    next(err);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const { motivoCancelacion } = req.body;
    const pedido = await pedidosService.cancelar(
      req.params.id,
      motivoCancelacion
    );

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

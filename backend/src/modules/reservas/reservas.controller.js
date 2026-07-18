import * as reservasService from "./reservas.service.js";
import { ok, created } from "../../utils/response.js";

export const listar = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.mesaId) filters.mesaId = Number(req.query.mesaId);
    if (req.query.fecha) filters.fecha = req.query.fecha;
    if (req.query.estado) filters.estado = req.query.estado;
    const reservas = await reservasService.listar(filters);
    ok(res, reservas);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const reserva = await reservasService.crear(req.body);
    const io = req.app.get("io");
    if (io) {
      io.to("room:all").emit("reserva:nueva", reserva);
    }
    created(res, reserva, "Reserva creada");
  } catch (err) {
    next(err);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const reserva = await reservasService.cancelar(req.params.id);
    const io = req.app.get("io");
    if (io) {
      io.to("room:all").emit("reserva:eliminada", { id: reserva.id, mesaId: reserva.mesaId });
    }
    ok(res, reserva, "Reserva cancelada");
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const reserva = await reservasService.actualizar(Number(req.params.id), req.body);
    const io = req.app.get("io");
    if (io) {
      io.to("room:all").emit("reserva:actualizada", reserva);
    }
    ok(res, reserva, "Reserva actualizada");
  } catch (err) {
    next(err);
  }
};

export const convertir = async (req, res, next) => {
  try {
    const pedido = await reservasService.convertir(req.params.id, req.body, req.user.id);
    const io = req.app.get("io");
    if (io) {
      io.to("room:all").emit("reserva:eliminada", { id: Number(req.params.id), mesaId: pedido.mesaId });
    }
    created(res, pedido, "Reserva convertida a pedido");
  } catch (err) {
    next(err);
  }
};

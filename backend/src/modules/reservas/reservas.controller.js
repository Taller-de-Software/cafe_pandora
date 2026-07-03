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
    created(res, reserva, "Reserva creada");
  } catch (err) {
    next(err);
  }
};

export const cancelar = async (req, res, next) => {
  try {
    const reserva = await reservasService.cancelar(req.params.id);
    ok(res, reserva, "Reserva cancelada");
  } catch (err) {
    next(err);
  }
};

export const convertir = async (req, res, next) => {
  try {
    const pedido = await reservasService.convertir(req.params.id, req.body, req.user.id);
    created(res, pedido, "Reserva convertida a pedido");
  } catch (err) {
    next(err);
  }
};

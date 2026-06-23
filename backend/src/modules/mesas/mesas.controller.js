import * as mesasService from "./mesas.service.js";
import { ok, created } from "../../utils/response.js";

export const listar = async (req, res, next) => {
  try {
    const mesas = await mesasService.listar();
    ok(res, mesas);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const mesa = await mesasService.obtener(req.params.id);
    ok(res, mesa);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const mesa = await mesasService.crear(req.body);
    created(res, mesa, "Mesa creada");
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const mesa = await mesasService.actualizar(req.params.id, req.body);
    ok(res, mesa, "Mesa actualizada");
  } catch (err) {
    next(err);
  }
};

export const eliminar = async (req, res, next) => {
  try {
    await mesasService.eliminar(req.params.id);
    ok(res, null, "Mesa eliminada");
  } catch (err) {
    next(err);
  }
};

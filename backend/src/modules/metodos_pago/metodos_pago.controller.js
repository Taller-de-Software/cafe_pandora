import * as metodosPagoService from "./metodos_pago.service.js";
import { ok, created } from "../../utils/response.js";

export const listar = async (req, res, next) => {
  try {
    const metodos = await metodosPagoService.listar();
    ok(res, metodos);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const metodo = await metodosPagoService.obtener(req.params.id);
    ok(res, metodo);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const metodo = await metodosPagoService.crear(req.body);
    created(res, metodo, "Método de pago creado");
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const metodo = await metodosPagoService.actualizar(req.params.id, req.body);
    ok(res, metodo, "Método de pago actualizado");
  } catch (err) {
    next(err);
  }
};

export const eliminar = async (req, res, next) => {
  try {
    await metodosPagoService.eliminar(req.params.id);
    ok(res, null, "Método de pago eliminado");
  } catch (err) {
    next(err);
  }
};

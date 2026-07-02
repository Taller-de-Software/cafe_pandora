import * as ventasService from "./ventas.service.js";
import { ok } from "../../utils/response.js";

export const dia = async (req, res, next) => {
  try {
    const data = await ventasService.dia();
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const semana = async (req, res, next) => {
  try {
    const data = await ventasService.semana();
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

export const mes = async (req, res, next) => {
  try {
    const data = await ventasService.mes();
    ok(res, data);
  } catch (err) {
    next(err);
  }
};

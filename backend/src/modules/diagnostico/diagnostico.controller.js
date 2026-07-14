import * as diagnosticoService from "./diagnostico.service.js";
import { ok, error } from "../../utils/response.js";

export const obtenerDiagnostico = async (req, res, next) => {
  try {
    const result = await diagnosticoService.obtenerDiagnosticoCompleto();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const probarImpresora = async (req, res, next) => {
  try {
    const result = await diagnosticoService.probarImpresora();
    if (result.success) {
      ok(res, result);
    } else {
      error(res, result.error, 503);
    }
  } catch (err) {
    next(err);
  }
};

export const imprimirPrueba = async (req, res, next) => {
  try {
    const result = await diagnosticoService.imprimirPrueba();
    if (result.success) {
      ok(res, result);
    } else {
      error(res, result.error, 503);
    }
  } catch (err) {
    next(err);
  }
};
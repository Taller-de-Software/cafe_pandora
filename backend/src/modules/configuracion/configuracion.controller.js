import * as configuracionService from "./configuracion.service.js";
import { ok } from "../../utils/response.js";

export const obtenerModoImpresion = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerModoImpresion();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const actualizarModoImpresion = async (req, res, next) => {
  try {
    const { modoImpresion } = req.body;
    const result = await configuracionService.actualizarModoImpresion(modoImpresion);
    ok(res, result, `Modo de impresión cambiado a: ${modoImpresion}`);
  } catch (err) {
    next(err);
  }
};

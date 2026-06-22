import * as impresionService from "./impresion.service.js";
import { ok, error } from "../../utils/response.js";

export const imprimirFacturaCocina = async (req, res, next) => {
  try {
    const result = await impresionService.imprimirFacturaCocina(parseInt(req.params.pedidoId));
    ok(res, result, "Factura de cocina impresa");
  } catch (err) {
    if (err.message.includes("Impresora no")) {
      return error(res, err.message, 503);
    }
    next(err);
  }
};

export const imprimirReciboPago = async (req, res, next) => {
  try {
    const result = await impresionService.imprimirReciboPago(parseInt(req.params.facturaId));
    ok(res, result, "Recibo de pago impreso");
  } catch (err) {
    if (err.message.includes("Impresora no")) {
      return error(res, err.message, 503);
    }
    next(err);
  }
};

export const probarImpresora = async (req, res, next) => {
  try {
    const result = await impresionService.probarImpresora();
    ok(res, result, "Impresora conectada correctamente");
  } catch (err) {
    error(res, err.message, 503);
  }
};

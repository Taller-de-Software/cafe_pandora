import * as impresionService from "./impresion.service.js";
import { ok, error } from "../../utils/response.js";

export const imprimirFacturaCocina = async (req, res, next) => {
  try {
    const result = await impresionService.imprimirFacturaCocina(parseInt(req.params.pedidoId));
    const message = result.pdfUrl ? "Factura de cocina impresa (simulada)" : "Factura de cocina impresa";
    ok(res, result, message);
  } catch (err) {
    if (err.message.includes("Impresora no")) {
      return error(res, err.message, 503);
    }
    next(err);
  }
};

export const imprimirReciboPago = async (req, res, next) => {
  try {
    const result = await impresionService.imprimirReciboPago(parseInt(req.params.id));
    const message = result.pdfUrl ? "Recibo de pago impreso (simulado)" : "Recibo de pago impreso";
    ok(res, result, message);
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
    const message = result.message?.includes("simulación") ? "Modo simulación activo" : "Impresora conectada correctamente";
    ok(res, result, message);
  } catch (err) {
    error(res, err.message, 503);
  }
};

export const obtenerModoImpresion = async (req, res, next) => {
  try {
    const result = await impresionService.obtenerModoImpresion();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const cambiarModoImpresion = async (req, res, next) => {
  try {
    const { mode } = req.body;
    if (!mode || !["simulate", "real"].includes(mode)) {
      return error(res, 'Modo inválido. Usa "simulate" o "real".', 400);
    }
    const result = await impresionService.cambiarModoImpresion(mode);
    ok(res, result, `Modo de impresión: ${result.mode}`);
  } catch (err) {
    error(res, err.message, 400);
  }
};

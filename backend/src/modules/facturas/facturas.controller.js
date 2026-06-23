import * as facturasService from "./facturas.service.js";
import { ok, created } from "../../utils/response.js";

export const listar = async (req, res, next) => {
  try {
    const { pedidoId } = req.query;
    const facturas = await facturasService.listar({
      pedidoId: pedidoId ? parseInt(pedidoId) : undefined,
    });
    ok(res, facturas);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const factura = await facturasService.obtener(req.params.id);
    ok(res, factura);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const factura = await facturasService.crear(req.body);
    created(res, factura, "Factura generada");
  } catch (err) {
    next(err);
  }
};

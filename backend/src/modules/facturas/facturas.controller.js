import { z } from "zod";
import * as facturasService from "./facturas.service.js";
import { ok, created } from "../../utils/response.js";

const idQuery = z.coerce.number().int().positive().optional();

export const listar = async (req, res, next) => {
  try {
    const pedidoId = idQuery.parse(req.query.pedidoId);
    const facturas = await facturasService.listar({ pedidoId });
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

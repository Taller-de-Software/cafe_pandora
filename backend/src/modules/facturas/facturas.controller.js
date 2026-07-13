import { z } from "zod";
import * as facturasService from "./facturas.service.js";
import { ok, created } from "../../utils/response.js";
import { ESTADOS_PEDIDO } from "../../config/constants.js";

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

export const obtenerComprobante = async (req, res, next) => {
  try {
    const result = await facturasService.obtenerComprobante(req.params.id);
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const comprobanteDisponible = async (req, res, next) => {
  try {
    const result = await facturasService.comprobanteDisponible(req.params.id);
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const factura = await facturasService.crear(req.body);

    const io = req.app.get("io");
    io.to("room:all").emit("pedido:estado", {
      pedidoId: factura.pedidoId,
      estado: ESTADOS_PEDIDO.FINALIZADO,
    });

    created(res, factura, "Factura generada");
  } catch (err) {
    next(err);
  }
};

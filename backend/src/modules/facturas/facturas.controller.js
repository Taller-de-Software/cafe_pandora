import * as facturasService from "./facturas.service.js";
import { ok, created } from "../../utils/response.js";

function getIO(req) {
  return req.app.get("io");
}

export const listar = async (req, res, next) => {
  try {
    const { pedidoId, tipo } = req.query;
    const facturas = await facturasService.listar({
      pedidoId: pedidoId ? parseInt(pedidoId) : undefined,
      tipo,
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

export const generarFacturaCocina = async (req, res, next) => {
  try {
    const factura = await facturasService.generarFacturaCocina(parseInt(req.params.pedidoId));

    const io = getIO(req);
    io.to("room:all").emit("impresion:lista", { facturaId: factura.id, tipo: "COCINA" });

    created(res, factura, "Factura de cocina generada");
  } catch (err) {
    next(err);
  }
};

export const generarFacturaPago = async (req, res, next) => {
  try {
    const factura = await facturasService.generarFacturaPago(parseInt(req.params.pedidoId));

    const io = getIO(req);
    io.to("room:all").emit("impresion:lista", { facturaId: factura.id, tipo: "PAGO" });

    created(res, factura, "Factura de pago generada");
  } catch (err) {
    next(err);
  }
};

export const generarFacturaGrupoPago = async (req, res, next) => {
  try {
    const factura = await facturasService.generarFacturaGrupoPago(parseInt(req.params.grupoId));

    const io = getIO(req);
    io.to("room:all").emit("impresion:lista", { facturaId: factura.id, tipo: "PAGO" });

    created(res, factura, "Factura de pago grupal generada");
  } catch (err) {
    next(err);
  }
};

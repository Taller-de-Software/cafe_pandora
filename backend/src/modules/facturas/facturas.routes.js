import { Router } from "express";
import * as facturasController from "./facturas.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", facturasController.listar);
router.get("/:id", facturasController.obtener);
router.post("/cocina/:pedidoId", facturasController.generarFacturaCocina);
router.post("/pago/:pedidoId", facturasController.generarFacturaPago);
router.post("/pago/grupo/:grupoId", facturasController.generarFacturaGrupoPago);

export default router;

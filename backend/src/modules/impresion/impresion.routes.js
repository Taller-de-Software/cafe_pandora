import { Router } from "express";
import * as impresionController from "./impresion.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validateId } from "../../middleware/validate.js";

const router = Router();

router.use(authenticate);

router.post("/cocina/:pedidoId", validateId, impresionController.imprimirFacturaCocina);
router.post("/pago/:facturaId", validateId, impresionController.imprimirReciboPago);
router.post("/probar", impresionController.probarImpresora);

export default router;

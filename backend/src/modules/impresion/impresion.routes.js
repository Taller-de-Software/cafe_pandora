import { Router } from "express";
import * as impresionController from "./impresion.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.post("/cocina/:pedidoId", impresionController.imprimirFacturaCocina);
router.post("/pago/:facturaId", impresionController.imprimirReciboPago);
router.post("/probar", impresionController.probarImpresora);

export default router;

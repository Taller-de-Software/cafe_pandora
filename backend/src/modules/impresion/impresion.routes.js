import { Router } from "express";
import * as impresionController from "./impresion.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validateId } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.post("/cocina/:id", authorize(ROLES.ADMIN), validateId, impresionController.imprimirFacturaCocina);
router.post("/pago/:id", authorize(ROLES.ADMIN), validateId, impresionController.imprimirReciboPago);
router.post("/probar", impresionController.probarImpresora);

export default router;

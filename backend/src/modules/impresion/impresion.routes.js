import { Router } from "express";
import * as impresionController from "./impresion.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validateId } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/mode", impresionController.obtenerModoImpresion);
router.put("/mode", authorize(ROLES.ADMIN), impresionController.cambiarModoImpresion);

router.post("/cocina/:pedidoId", validateId, impresionController.imprimirFacturaCocina);
router.post("/pago/:id", validateId, impresionController.imprimirReciboPago);
router.post("/probar", impresionController.probarImpresora);

export default router;

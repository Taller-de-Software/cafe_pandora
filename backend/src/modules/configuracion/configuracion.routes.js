import { Router } from "express";
import * as configuracionController from "./configuracion.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate } from "../../middleware/validate.js";
import { actualizarModoImpresionSchema } from "./configuracion.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/impresion", configuracionController.obtenerModoImpresion);
router.put("/impresion", authorize(ROLES.ADMIN), validate(actualizarModoImpresionSchema), configuracionController.actualizarModoImpresion);

export default router;

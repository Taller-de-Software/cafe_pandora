import { Router } from "express";
import * as metodosPagoController from "./metodos_pago.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearMetodoPagoSchema, actualizarMetodoPagoSchema } from "./metodos_pago.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", metodosPagoController.listar);
router.get("/:id", validateId, metodosPagoController.obtener);
router.post("/", authorize(ROLES.ADMIN), validate(crearMetodoPagoSchema), metodosPagoController.crear);
router.put("/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarMetodoPagoSchema), metodosPagoController.actualizar);
router.delete("/:id", authorize(ROLES.ADMIN), validateId, metodosPagoController.eliminar);

export default router;

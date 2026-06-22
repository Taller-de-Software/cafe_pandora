import { Router } from "express";
import * as mesasController from "./mesas.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearMesaSchema, actualizarMesaSchema } from "./mesas.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", mesasController.listar);
router.get("/:id", validateId, mesasController.obtener);
router.post("/", authorize(ROLES.ADMIN), validate(crearMesaSchema), mesasController.crear);
router.put("/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarMesaSchema), mesasController.actualizar);
router.delete("/:id", authorize(ROLES.ADMIN), validateId, mesasController.eliminar);

export default router;

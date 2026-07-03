import { Router } from "express";
import * as reservasController from "./reservas.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearReservaSchema, convertirReservaSchema } from "./reservas.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", reservasController.listar);
router.post("/", validate(crearReservaSchema), reservasController.crear);
router.post("/:id/cancelar", validateId, reservasController.cancelar);
router.post("/:id/convertir", validateId, validate(convertirReservaSchema), reservasController.convertir);

export default router;

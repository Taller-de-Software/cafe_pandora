import { Router } from "express";
import * as facturasController from "./facturas.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearFacturaSchema } from "./facturas.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", facturasController.listar);
router.get("/:id", validateId, facturasController.obtener);
router.post("/", validate(crearFacturaSchema), facturasController.crear);

export default router;

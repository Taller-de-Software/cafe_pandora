import { Router } from "express";
import * as facturasController from "./facturas.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import { crearFacturaSchema } from "./facturas.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", facturasController.listar);
router.get("/:id", validateId, facturasController.obtener);
router.get("/:id/comprobante", validateId, facturasController.obtenerComprobante);
router.get("/:id/comprobante-disponible", validateId, facturasController.comprobanteDisponible);
router.get("/:id/comprobante-archivo", validateId, facturasController.descargarComprobante);
router.post("/", authorize(ROLES.ADMIN), validate(crearFacturaSchema), facturasController.crear);

export default router;

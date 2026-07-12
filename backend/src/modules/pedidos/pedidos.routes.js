import { Router } from "express";
import * as pedidosController from "./pedidos.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import { crearPedidoSchema, cambiarEstadoSchema } from "./pedidos.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", pedidosController.listar);
router.get("/:id", validateId, pedidosController.obtener);
router.post("/", validate(crearPedidoSchema), pedidosController.crear);
router.put("/:id/estado", authorize(ROLES.ADMIN), validateId, validate(cambiarEstadoSchema), pedidosController.cambiarEstado);
router.post("/:id/cancelar", authorize(ROLES.ADMIN), validateId, pedidosController.cancelar);

export default router;

import { Router } from "express";
import * as pedidosController from "./pedidos.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearPedidoSchema, cambiarEstadoSchema, fusionarSchema } from "./pedidos.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", pedidosController.listar);
router.get("/:id", validateId, pedidosController.obtener);
router.post("/", validate(crearPedidoSchema), pedidosController.crear);
router.put("/:id/detalle/:detalleId/completar", pedidosController.completarDetalle);
router.post("/fusionar", validate(fusionarSchema), pedidosController.fusionarPedidos);
router.post("/:id/cancelar", validateId, pedidosController.cancelar);

router.put("/:id/estado", validateId, authorize(ROLES.ADMIN), validate(cambiarEstadoSchema), pedidosController.cambiarEstado);

export default router;

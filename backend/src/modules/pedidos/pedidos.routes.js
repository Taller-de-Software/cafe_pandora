import { Router } from "express";
import * as pedidosController from "./pedidos.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { ROLES } from "../../config/constants.js";
import {
  crearPedidoSchema,
  cambiarEstadoSchema,
  actualizarItemsSchema,
  separarCuentaSchema,
  unirMesasSchema,
  cambiarMesaSchema,
  abonoSchema,
} from "./pedidos.validation.js";

const router = Router();

router.use(authenticate);

router.get("/", pedidosController.listar);
router.get("/:id", validateId, pedidosController.obtener);
router.post("/", validate(crearPedidoSchema), pedidosController.crear);
router.put("/:id/estado", authorize(ROLES.ADMIN), validateId, validate(cambiarEstadoSchema), pedidosController.cambiarEstado);
router.post("/:id/cancelar", authorize(ROLES.ADMIN), validateId, pedidosController.cancelar);
router.patch("/:id/items", authorize(ROLES.ADMIN), validateId, validate(actualizarItemsSchema), pedidosController.actualizarItems);
router.post("/:id/separar", authorize(ROLES.ADMIN), validateId, validate(separarCuentaSchema), pedidosController.separarCuenta);
router.post("/:id/unir", authorize(ROLES.ADMIN), validateId, validate(unirMesasSchema), pedidosController.unirMesas);
router.put("/:id/mesa", authorize(ROLES.ADMIN), validateId, validate(cambiarMesaSchema), pedidosController.cambiarMesa);
router.post("/:id/abono", authorize(ROLES.ADMIN), validateId, validate(abonoSchema), pedidosController.registrarAbono);

export default router;

import { Router } from "express";
import * as usuariosController from "./usuarios.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "./usuarios.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.post("/", validate(crearUsuarioSchema), usuariosController.crear);

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get("/", usuariosController.listar);
router.get("/:id", validateId, usuariosController.obtener);
router.put("/:id", validateId, validate(actualizarUsuarioSchema), usuariosController.actualizar);
router.delete("/:id", validateId, usuariosController.eliminar);

export default router;

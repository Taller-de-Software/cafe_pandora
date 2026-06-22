import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearCategoriaSchema, actualizarCategoriaSchema, crearProductoSchema, actualizarProductoSchema } from "./menu.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/categorias", menuController.listarCategorias);
router.get("/productos", menuController.listarProductos);
router.get("/productos/:id", validateId, menuController.obtenerProducto);

router.post("/categorias", authorize(ROLES.ADMIN), validate(crearCategoriaSchema), menuController.crearCategoria);
router.put("/categorias/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarCategoriaSchema), menuController.actualizarCategoria);
router.delete("/categorias/:id", authorize(ROLES.ADMIN), validateId, menuController.eliminarCategoria);
router.post("/productos", authorize(ROLES.ADMIN), validate(crearProductoSchema), menuController.crearProducto);
router.put("/productos/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarProductoSchema), menuController.actualizarProducto);
router.delete("/productos/:id", authorize(ROLES.ADMIN), validateId, menuController.eliminarProducto);

export default router;

import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { crearCategoriaSchema, actualizarCategoriaSchema, crearSubcategoriaSchema, actualizarSubcategoriaSchema, crearProductoSchema, actualizarProductoSchema } from "./menu.validation.js";
import { ROLES } from "../../config/constants.js";
import upload from "../../utils/upload.js";

const router = Router();

router.use(authenticate);

router.get("/categorias", menuController.listarCategorias);
router.get("/productos", menuController.listarProductos);
router.get("/productos/:id", validateId, menuController.obtenerProducto);

router.post("/categorias", authorize(ROLES.ADMIN), validate(crearCategoriaSchema), menuController.crearCategoria);
router.put("/categorias/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarCategoriaSchema), menuController.actualizarCategoria);
router.delete("/categorias/:id", authorize(ROLES.ADMIN), validateId, menuController.eliminarCategoria);

router.get("/subcategorias", menuController.listarSubcategorias);
router.post("/subcategorias", authorize(ROLES.ADMIN), validate(crearSubcategoriaSchema), menuController.crearSubcategoria);
router.put("/subcategorias/:id", authorize(ROLES.ADMIN), validateId, validate(actualizarSubcategoriaSchema), menuController.actualizarSubcategoria);
router.delete("/subcategorias/:id", authorize(ROLES.ADMIN), validateId, menuController.eliminarSubcategoria);
router.post("/productos", authorize(ROLES.ADMIN), upload.single("imagen"), validate(crearProductoSchema), menuController.crearProducto);
router.put("/productos/:id", authorize(ROLES.ADMIN), validateId, upload.single("imagen"), validate(actualizarProductoSchema), menuController.actualizarProducto);
router.delete("/productos/:id", authorize(ROLES.ADMIN), validateId, menuController.eliminarProducto);

export default router;

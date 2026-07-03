import { Router } from "express";
import * as cajaController from "./caja.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate, validateId } from "../../middleware/validate.js";
import { aperturaSchema, retiroSchema } from "./caja.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

// Rutas fijas (sin parámetros)
router.get("/", cajaController.listarSesiones);
router.get("/activa", cajaController.obtenerSesionActiva);
router.post("/apertura", authorize(ROLES.ADMIN), validate(aperturaSchema), cajaController.apertura);

// Rutas parametrizadas
router.get("/:id", validateId, cajaController.obtenerSesion);
router.post("/:id/cierre", authorize(ROLES.ADMIN), validateId, cajaController.cierre);
router.get("/:id/resumen", validateId, cajaController.resumenSesion);
router.get("/:id/retiros", validateId, cajaController.listarRetiros);
router.post("/:id/retiros", authorize(ROLES.ADMIN), validateId, validate(retiroSchema), cajaController.crearRetiro);

export default router;

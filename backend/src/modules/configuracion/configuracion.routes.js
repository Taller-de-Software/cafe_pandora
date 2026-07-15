import { Router } from "express";
import * as configuracionController from "./configuracion.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { validate } from "../../middleware/validate.js";
import {
  actualizarModoImpresionSchema,
  guardarPrinterConfigSchema,
  guardarFrontendPortSchema,
  guardarConfigGeneralSchema,
} from "./configuracion.validation.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

// Modo impresión
router.get("/impresion", configuracionController.obtenerModoImpresion);
router.put("/impresion", authorize(ROLES.ADMIN), validate(actualizarModoImpresionSchema), configuracionController.actualizarModoImpresion);

// Config impresión completa
router.get("/impresion/config", configuracionController.obtenerConfigImpresion);

// Printer config
router.get("/impresion/printers", configuracionController.listarPrinters);
router.put("/impresion/printer", authorize(ROLES.ADMIN), validate(guardarPrinterConfigSchema), configuracionController.guardarPrinterConfig);
router.post("/impresion/test", configuracionController.probarConexion);

// Frontend port
router.get("/frontend", configuracionController.obtenerFrontendPort);
router.put("/frontend", authorize(ROLES.ADMIN), validate(guardarFrontendPortSchema), configuracionController.guardarFrontendPort);

// Database health
router.get("/health", configuracionController.checkDatabaseHealth);

// General configuration
router.get("/general", configuracionController.obtenerConfigGeneral);
router.put("/general", authorize(ROLES.ADMIN), validate(guardarConfigGeneralSchema), configuracionController.guardarConfigGeneral);

export default router;

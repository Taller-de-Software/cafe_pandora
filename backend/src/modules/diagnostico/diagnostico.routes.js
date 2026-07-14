import { Router } from "express";
import * as diagnosticoController from "./diagnostico.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/", authorize(ROLES.ADMIN), diagnosticoController.obtenerDiagnostico);
router.post("/impresora/probar", authorize(ROLES.ADMIN), diagnosticoController.probarImpresora);
router.post("/impresora/imprimir-prueba", authorize(ROLES.ADMIN), diagnosticoController.imprimirPrueba);

export default router;
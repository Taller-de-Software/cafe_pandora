import { Router } from "express";
import * as redController from "./red.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { authorize } from "../../middleware/roles.js";
import { ROLES } from "../../config/constants.js";

const router = Router();

router.use(authenticate);

router.get("/interfaces", redController.obtenerInterfaces);
router.get("/connect-urls", redController.obtenerUrlsConexion);
router.get("/internet", redController.obtenerInternetStatus);
router.get("/diagnostico", authorize(ROLES.ADMIN), redController.obtenerDiagnostico);
router.get("/diagnostico-detallado", authorize(ROLES.ADMIN), redController.obtenerDiagnosticoDetallado);
router.get("/qr", redController.obtenerQrCodes);
router.get("/network-info", redController.obtenerNetworkInfo);
router.post("/test-port", authorize(ROLES.ADMIN), redController.probarPuerto);
router.get("/configuracion", authorize(ROLES.ADMIN), redController.obtenerConfiguracionRed);

export default router;
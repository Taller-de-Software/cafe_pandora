import { Router } from "express";
import * as ventasController from "./ventas.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/dia", ventasController.dia);
router.get("/semana", ventasController.semana);
router.get("/mes", ventasController.mes);

export default router;

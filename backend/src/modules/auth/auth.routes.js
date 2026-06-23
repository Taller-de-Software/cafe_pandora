import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.me);

export default router;

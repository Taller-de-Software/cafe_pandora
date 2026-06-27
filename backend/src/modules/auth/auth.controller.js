import * as authService from "./auth.service.js";
import { ok } from "../../utils/response.js";

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return ok(res, result, "Inicio de sesión exitoso");
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refresh(req.body);
    return ok(res, result, "Token renovado exitosamente");
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const usuario = await authService.getMe(req.user.id);
    return ok(res, usuario);
  } catch (err) {
    next(err);
  }
};

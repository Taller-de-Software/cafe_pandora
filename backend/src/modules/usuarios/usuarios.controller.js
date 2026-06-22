import * as usuariosService from "./usuarios.service.js";
import { ok, created } from "../../utils/response.js";

export const listar = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.listar();
    ok(res, usuarios);
  } catch (err) {
    next(err);
  }
};

export const obtener = async (req, res, next) => {
  try {
    const usuario = await usuariosService.obtener(req.params.id);
    ok(res, usuario);
  } catch (err) {
    next(err);
  }
};

export const crear = async (req, res, next) => {
  try {
    const usuario = await usuariosService.crear(req.body);
    created(res, usuario, "Usuario creado");
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    const usuario = await usuariosService.actualizar(req.params.id, req.body);
    ok(res, usuario, "Usuario actualizado");
  } catch (err) {
    next(err);
  }
};

export const eliminar = async (req, res, next) => {
  try {
    await usuariosService.eliminar(req.params.id);
    ok(res, null, "Usuario eliminado");
  } catch (err) {
    next(err);
  }
};

import * as cajaService from "./caja.service.js";
import { ok, created } from "../../utils/response.js";

export const listarSesiones = async (req, res, next) => {
  try {
    const sesiones = await cajaService.listarSesiones();
    ok(res, sesiones);
  } catch (err) {
    next(err);
  }
};

export const obtenerSesion = async (req, res, next) => {
  try {
    const sesion = await cajaService.obtenerSesion(req.params.id);
    ok(res, sesion);
  } catch (err) {
    next(err);
  }
};

export const obtenerSesionActiva = async (req, res, next) => {
  try {
    const sesion = await cajaService.obtenerSesionActiva();
    ok(res, sesion);
  } catch (err) {
    next(err);
  }
};

export const apertura = async (req, res, next) => {
  try {
    const sesion = await cajaService.apertura(req.body.baseInicial);
    created(res, sesion, "Sesión de caja abierta");
  } catch (err) {
    next(err);
  }
};

export const cierre = async (req, res, next) => {
  try {
    const sesion = await cajaService.cierre(req.params.id);
    ok(res, sesion, "Sesión de caja cerrada");
  } catch (err) {
    next(err);
  }
};

export const resumenSesion = async (req, res, next) => {
  try {
    const resumen = await cajaService.resumenSesion(req.params.id);
    ok(res, resumen);
  } catch (err) {
    next(err);
  }
};

export const listarRetiros = async (req, res, next) => {
  try {
    const retiros = await cajaService.listarRetiros(req.params.id);
    ok(res, retiros);
  } catch (err) {
    next(err);
  }
};

export const crearRetiro = async (req, res, next) => {
  try {
    const retiro = await cajaService.crearRetiro(req.params.id, req.body);
    created(res, retiro, "Retiro registrado");
  } catch (err) {
    next(err);
  }
};

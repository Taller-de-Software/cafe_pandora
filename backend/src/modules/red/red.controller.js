import * as redService from "./red.service.js";
import { ok } from "../../utils/response.js";
import { getNetworkInterfaces } from "../../config/network.js";

export const obtenerInterfaces = async (req, res, next) => {
  try {
    const result = await redService.obtenerInterfaces();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const obtenerUrlsConexion = async (req, res, next) => {
  try {
    const result = await redService.obtenerUrlsConexion();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const obtenerInternetStatus = async (req, res, next) => {
  try {
    const interfaces = await getNetworkInterfaces();
    const internet = interfaces.some((i) => i.internet);
    ok(res, { online: internet });
  } catch (err) {
    next(err);
  }
};

export const obtenerQrCodes = async (req, res, next) => {
  try {
    const result = await redService.obtenerQrCodes();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const obtenerDiagnostico = async (req, res, next) => {
  try {
    const result = await redService.obtenerDiagnostico();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const probarPuerto = async (req, res, next) => {
  try {
    const { host, port } = req.body;
    const result = await redService.probarPuerto(host, port);
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const obtenerConfiguracionRed = async (req, res, next) => {
  try {
    const result = await redService.obtenerConfiguracionRed();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};
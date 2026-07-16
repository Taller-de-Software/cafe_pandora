import * as configuracionService from "./configuracion.service.js";
import { testPrinterConnection, listAllPrinters } from "../../utils/printer.js";
import { ok } from "../../utils/response.js";

// ─── Modo impresión ─────────────────────────────────────────────────────────

export const obtenerModoImpresion = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerModoImpresion();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const actualizarModoImpresion = async (req, res, next) => {
  try {
    const { modoImpresion } = req.body;
    const result = await configuracionService.actualizarModoImpresion(modoImpresion);
    ok(res, result, `Modo de impresión cambiado a: ${modoImpresion}`);
  } catch (err) {
    next(err);
  }
};

// ─── Config impresión completa ───────────────────────────────────────────────

export const obtenerConfigImpresion = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerConfigImpresion();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── Printer config ──────────────────────────────────────────────────────────

export const guardarPrinterConfig = async (req, res, next) => {
  try {
    const result = await configuracionService.guardarPrinterConfig(req.body);
    ok(res, result, "Configuración de impresora guardada");
  } catch (err) {
    next(err);
  }
};

export const listarPrinters = async (req, res, next) => {
  try {
    const result = await listAllPrinters();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const probarConexion = async (req, res, next) => {
  try {
    const result = await testPrinterConnection();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── Frontend port ──────────────────────────────────────────────────────────

export const obtenerFrontendPort = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerFrontendPort();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const guardarFrontendPort = async (req, res, next) => {
  try {
    const { frontendPort } = req.body;
    const result = await configuracionService.guardarFrontendPort(frontendPort);
    ok(res, result, "Puerto del frontend actualizado");
  } catch (err) {
    next(err);
  }
};

// ─── Preferred network interface ───────────────────────────────────────

export const obtenerPreferredInterface = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerPreferredInterface();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const guardarPreferredInterface = async (req, res, next) => {
  try {
    const { preferredInterfaceName } = req.body;
    const result = await configuracionService.guardarPreferredInterface(preferredInterfaceName);
    ok(res, result, "Interfaz de red principal actualizada");
  } catch (err) {
    next(err);
  }
};

// ─── Database health check ──────────────────────────────────────────────

export const checkDatabaseHealth = async (req, res, next) => {
  try {
    const result = await configuracionService.checkDatabaseHealth();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── General configuration ─────────────────────────────────────────────

export const obtenerConfigGeneral = async (req, res, next) => {
  try {
    const result = await configuracionService.obtenerConfigGeneral();
    ok(res, result);
  } catch (err) {
    next(err);
  }
};

export const guardarConfigGeneral = async (req, res, next) => {
  try {
    const result = await configuracionService.guardarConfigGeneral(req.body);
    ok(res, result, "Configuración general actualizada");
  } catch (err) {
    next(err);
  }
};

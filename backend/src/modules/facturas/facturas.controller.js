import * as Service from "./facturas.service.js";

export const listar = async (req, res, next) => {
  try {
    const data = await Service.listar();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export const obtener = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Service.obtener(Number(id));
    if (!data) return res.status(404).json({ message: "Factura no encontrada" });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export const crear = async (req, res, next) => {
  try {
    const data = await Service.crear(req.body);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
}

export const actualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Service.actualizar(Number(id), req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export const eliminar = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Service.eliminar(Number(id));
    res.json({ message: "Factura eliminada correctamente" });
  } catch (err) {
    next(err);
  }
}

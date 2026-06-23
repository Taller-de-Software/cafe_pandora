import * as menuService from "./menu.service.js";
import { ok, created } from "../../utils/response.js";

export const listarCategorias = async (req, res, next) => {
  try {
    const categorias = await menuService.listarCategorias();
    ok(res, categorias);
  } catch (err) {
    next(err);
  }
};

export const crearCategoria = async (req, res, next) => {
  try {
    const categoria = await menuService.crearCategoria(req.body);
    created(res, categoria, "Categoría creada");
  } catch (err) {
    next(err);
  }
};

export const actualizarCategoria = async (req, res, next) => {
  try {
    const categoria = await menuService.actualizarCategoria(req.params.id, req.body);
    ok(res, categoria, "Categoría actualizada");
  } catch (err) {
    next(err);
  }
};

export const eliminarCategoria = async (req, res, next) => {
  try {
    await menuService.eliminarCategoria(req.params.id);
    ok(res, null, "Categoría eliminada");
  } catch (err) {
    next(err);
  }
};

export const listarProductos = async (req, res, next) => {
  try {
    const { categoriaId } = req.query;
    const productos = await menuService.listarProductos(categoriaId ? parseInt(categoriaId) : undefined);
    ok(res, productos);
  } catch (err) {
    next(err);
  }
};

export const obtenerProducto = async (req, res, next) => {
  try {
    const producto = await menuService.obtenerProducto(req.params.id);
    ok(res, producto);
  } catch (err) {
    next(err);
  }
};

export const crearProducto = async (req, res, next) => {
  try {
    const producto = await menuService.crearProducto(req.body);
    created(res, producto, "Producto creado");
  } catch (err) {
    next(err);
  }
};

export const actualizarProducto = async (req, res, next) => {
  try {
    const producto = await menuService.actualizarProducto(req.params.id, req.body);
    ok(res, producto, "Producto actualizado");
  } catch (err) {
    next(err);
  }
};

export const eliminarProducto = async (req, res, next) => {
  try {
    await menuService.eliminarProducto(req.params.id);
    ok(res, null, "Producto eliminado");
  } catch (err) {
    next(err);
  }
};

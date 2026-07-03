import { z } from "zod";

const booleanDesdeFormData = z.preprocess((val) => {
  if (typeof val === "boolean") return val;
  if (val === "true") return true;
  if (val === "false") return false;
  return undefined;
}, z.boolean());

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
}).strict();

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
}).strict();

export const crearSubcategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  categoriaId: z.coerce.number().int().positive("Debe seleccionar una categoría"),
}).strict();

export const actualizarSubcategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
}).strict();

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  requierePreparacion: booleanDesdeFormData,
  habilitado: booleanDesdeFormData,
  categoriaId: z.coerce.number().int().positive("Debe seleccionar una categoría"),
  subcategoriaId: z.coerce.number().int().positive().optional(),
  imagenUrl: z.string().optional(),
}).strict();

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive().optional(),
  requierePreparacion: booleanDesdeFormData.optional(),
  habilitado: booleanDesdeFormData.optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
  subcategoriaId: z.coerce.number().int().positive().optional(),
  imagenUrl: z.string().optional(),
}).strict();



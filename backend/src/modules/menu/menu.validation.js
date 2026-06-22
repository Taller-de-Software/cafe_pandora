import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
}).strict();

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
}).strict();

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  categoriaId: z.number().int().positive("Debe seleccionar una categoría"),
}).strict();

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  precio: z.number().positive().optional(),
  categoriaId: z.number().int().positive().optional(),
}).strict();

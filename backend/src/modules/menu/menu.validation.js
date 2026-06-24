import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
});

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
}).strict();

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive("El precio debe ser mayor a 0"),
  categoriaId: z.coerce.number().int().positive("Debe seleccionar una categoría"),
}).strict();

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  descripcion: z.string().trim().optional(),
  precio: z.coerce.number().positive().optional(),
  categoriaId: z.coerce.number().int().positive().optional(),
}).strict();

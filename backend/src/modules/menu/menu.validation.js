import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  tipo: z.enum(["platillo", "bebida"]),
}).strict();

export const actualizarCategoriaSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  tipo: z.enum(["platillo", "bebida"]).optional(),
}).strict();

export const crearProductoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  descripcion: z.string().trim().optional(),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  imagenUrl: z.string().url().optional().nullable(),
  tipo: z.enum(["platillo", "bebida"]),
  categoriaId: z.number().int().positive("Debe seleccionar una categoría"),
}).strict();

export const actualizarProductoSchema = z.object({
  nombre: z.string().trim().min(1).max(200).optional(),
  descripcion: z.string().trim().optional(),
  precio: z.number().positive().optional(),
  imagenUrl: z.string().url().optional().nullable(),
  tipo: z.enum(["platillo", "bebida"]).optional(),
  categoriaId: z.number().int().positive().optional(),
}).strict();

import { z } from "zod";

export const crearMetodoPagoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  entidad: z.string().trim().optional(),
}).strict();

export const actualizarMetodoPagoSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  entidad: z.string().trim().optional(),
}).strict();

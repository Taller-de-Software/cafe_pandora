import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  rol: z.enum(["administrador", "mesero"]),
  pin: z.string().min(4, "El PIN debe tener al menos 4 caracteres").optional(),
}).strict();

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  pin: z.string().min(4).optional(),
}).strict();

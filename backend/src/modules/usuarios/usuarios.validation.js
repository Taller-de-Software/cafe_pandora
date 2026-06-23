import { z } from "zod";

export const crearUsuarioSchema = z.object({
  rol: z.enum(["administrador", "mesero"]),
  pin: z.string().min(4, "El PIN debe tener al menos 4 caracteres").optional(),
}).strict();

export const actualizarUsuarioSchema = z.object({
  pin: z.string().min(4).optional(),
}).strict();

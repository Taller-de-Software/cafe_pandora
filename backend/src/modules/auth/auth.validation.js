import { z } from "zod";

export const loginSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  rol: z.enum(["administrador", "mesero"]),
  pin: z.string().optional(),
}).strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
}).strict();

export const registerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  pin: z.string().min(4, "El PIN debe tener al menos 4 caracteres").optional(),
}).strict();

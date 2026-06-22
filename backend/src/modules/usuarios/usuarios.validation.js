import { z } from "zod";

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  email: z.email().transform(email => email.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(255),
  rol: z.enum(["ADMIN", "MESERO", "COCINA"]).default("MESERO"),
  activo: z.boolean().default(true),
}).strict();

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().trim().min(1).max(100).optional(),
  email: z.email().transform(email => email.toLowerCase()).optional(),
  password: z.string().min(8).max(255).optional(),
  rol: z.enum(["ADMIN", "MESERO", "COCINA"]).optional(),
  activo: z.boolean().optional(),
}).strict();

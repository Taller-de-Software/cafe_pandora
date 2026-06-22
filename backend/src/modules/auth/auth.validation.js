import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().transform(email => email.toLowerCase()),
  password: z.string().min(1, "La contraseña es obligatoria"),
}).strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "El refresh token es obligatorio"),
}).strict();

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "El refresh token es obligatorio"),
}).strict();

import { z } from "zod";

export const loginSchema = z.object({
  rol: z.enum(["administrador", "mesero"]),
  pin: z.string().optional(),
}).strict();

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
}).strict();

import { z } from "zod";

export const loginSchema = z.object({
  rol: z.enum(["administrador", "mesero"]),
  pin: z.string().optional(),
}).strict();

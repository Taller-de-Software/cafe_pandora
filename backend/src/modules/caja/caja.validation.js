import { z } from "zod";

export const aperturaSchema = z.object({
  baseInicial: z.number().positive("La base inicial debe ser mayor a 0"),
}).strict();

export const retiroSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
}).strict();

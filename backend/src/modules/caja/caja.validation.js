import { z } from "zod";

export const aperturaSchema = z.object({
  baseInicial: z.number().positive("La base inicial debe ser mayor a 0"),
}).strict();

export const retiroSchema = z.object({
  descripcion: z.string().trim().min(1, "La descripcion es obligatoria"),
  categoria: z.string().trim().optional(),
  monto: z.number().positive("El monto debe ser mayor a 0"),
}).strict();

import { z } from "zod";

export const imprimirSchema = z.object({
  pedidoId: z.number().int().positive().optional(),
  facturaId: z.number().int().positive().optional(),
}).strict();

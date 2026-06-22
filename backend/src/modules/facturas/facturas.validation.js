import { z } from "zod";

export const listarFacturasSchema = z.object({
  pedidoId: z.coerce.number().int().positive().optional(),
  tipo: z.enum(["COCINA", "PAGO"]).optional(),
}).strict();

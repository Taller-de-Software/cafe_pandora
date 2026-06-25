import { z } from "zod";

export const crearFacturaSchema = z.object({
  pedidoId: z.number().int().positive(),
  subtotal: z.number().positive(),
  impuestoConsumo: z.boolean().default(false),
  total: z.number().positive(),
  cambio: z.number().min(0).optional(),
  metodoPago: z.enum(["efectivo", "transferencia", "tarjeta"]),
  entidadBancaria: z.string().trim().optional(),
}).strict();

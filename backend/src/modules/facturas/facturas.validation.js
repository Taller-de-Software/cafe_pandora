import { z } from "zod";

export const crearFacturaSchema = z.object({
  pedidoId: z.number().int().positive(),
  subtotal: z.number().positive(),
  impuestoConsumo: z.number().min(0).default(0),
  total: z.number().positive(),
  metodoPagoId: z.number().int().positive("Debe seleccionar un metodo de pago"),
  cajaSesionId: z.number().int().positive(),
}).strict();

import { z } from "zod";

const itemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  nota: z.string().trim().optional(),
});

export const crearPedidoSchema = z.object({
  mesaId: z.number().int().positive("Debe seleccionar una mesa"),
  items: z.array(itemSchema).min(1, "Debe incluir al menos un item"),
}).strict();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(["RECIBIDO", "EN_PROCESO", "ESPERA_PAGO", "PAGADO", "CANCELADO"]),
  motivoCancelacion: z.string().trim().optional(),
}).strict();

export const fusionarSchema = z.object({
  pedidoIds: z.array(z.number().int().positive()).min(2, "Se requieren al menos 2 pedidos"),
}).strict();

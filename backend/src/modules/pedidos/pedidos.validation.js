import { z } from "zod";

const itemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  notas: z.string().trim().optional(),
});

export const crearPedidoSchema = z.object({
  mesaId: z.number().int().positive("Debe seleccionar una mesa"),
  turno: z.number().int().positive(),
  tipo: z.enum(["comida", "bebida", "mixto"]).optional(),
  items: z.array(itemSchema).min(1, "Debe incluir al menos un item"),
}).strict();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(["espera", "preparacion", "listo", "caja", "facturado", "cancelado"]),
}).strict();

export const fusionarSchema = z.object({
  pedidoIds: z.array(z.number().int().positive()).min(2, "Se requieren al menos 2 pedidos"),
}).strict();

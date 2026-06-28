import { z } from "zod";

export const crearMesaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de mesa es obligatorio"),
  ubicacion: z.string().trim().min(1, "La ubicacion es obligatoria"),
  estado: z.enum(["vacia", "ocupada", "por_pagar", "reservada"]).optional(),
  personalizada: z.boolean().default(false),
}).strict();

export const actualizarMesaSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  ubicacion: z.string().trim().min(1).optional(),
  estado: z.enum(["vacia", "ocupada", "por_pagar", "reservada"]).optional(),
  personalizada: z.boolean().optional(),
}).strict();

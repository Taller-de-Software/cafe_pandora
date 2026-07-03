import { z } from "zod";

const estadosMesa = z.enum(["vacia", "ocupada", "por_pagar", "reservada", "fuera_de_servicio"]);

export const crearMesaSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de mesa es obligatorio"),
  ubicacion: z.string().trim().min(1, "La ubicacion es obligatoria"),
  estado: estadosMesa.optional(),
  personalizada: z.boolean().default(false),
  capacidad: z.coerce.number().int().positive().default(4),
}).strict();

export const actualizarMesaSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  ubicacion: z.string().trim().min(1).optional(),
  estado: estadosMesa.optional(),
  personalizada: z.boolean().optional(),
  capacidad: z.coerce.number().int().positive().optional(),
}).strict();

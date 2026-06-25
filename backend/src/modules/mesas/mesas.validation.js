import { z } from "zod";

export const crearMesaSchema = z.object({
  numero: z.string().trim().min(1, "El numero de mesa es obligatorio"),
  ubicacion: z.string().trim().min(1, "La ubicacion es obligatoria"),
  capacidad: z.number().int().positive().optional(),
  personalizada: z.boolean().default(false),
}).strict();

export const actualizarMesaSchema = z.object({
  numero: z.string().trim().min(1).optional(),
  ubicacion: z.string().trim().min(1).optional(),
  capacidad: z.number().int().positive().optional(),
  estado: z.enum(["vacia", "ocupada", "por_pagar", "reservada"]).optional(),
  personalizada: z.boolean().optional(),
  meseroActualId: z.number().int().positive().optional(),
  nombreCliente: z.string().trim().optional(),
  fechaReserva: z.string().trim().optional(),
  horaReserva: z.string().trim().optional(),
}).strict();

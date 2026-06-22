import { z } from "zod";

export const crearMesaSchema = z.object({
  numero: z.number().int().positive("El número de mesa debe ser positivo"),
}).strict();

export const actualizarMesaSchema = z.object({
  numero: z.number().int().positive().optional(),
  estado: z.enum(["DISPONIBLE", "OCUPADA"]).optional(),
}).strict();

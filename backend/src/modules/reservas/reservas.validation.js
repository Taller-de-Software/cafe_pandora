import { z } from "zod";

export const crearReservaSchema = z.object({
  cliente: z.string().trim().min(1, "El nombre del cliente es obligatorio"),
  telefono: z.string().trim().optional(),
  fecha: z.coerce.date({ required_error: "La fecha es obligatoria" }),
  hora: z.string().trim().min(1, "La hora es obligatoria"),
  personas: z.coerce.number().int().positive("Debe ser al menos 1 persona").default(1),
  mesaId: z.number().int().positive("Debe seleccionar una mesa"),
}).strict();

export const actualizarReservaSchema = z.object({
  cliente: z.string().trim().min(1, "El nombre del cliente es obligatorio").optional(),
  telefono: z.string().trim().optional(),
  fecha: z.coerce.date().optional(),
  hora: z.string().trim().min(1, "La hora es obligatoria").optional(),
  personas: z.coerce.number().int().positive("Debe ser al menos 1 persona").optional(),
}).strict();

export const convertirReservaSchema = z.object({
  turno: z.number().int().positive(),
}).strict();

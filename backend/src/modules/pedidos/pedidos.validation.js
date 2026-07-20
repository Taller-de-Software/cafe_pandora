import { z } from "zod";

const itemSchema = z.object({
  productoId: z.number().int().positive(),
  cantidad: z.number().int().positive("La cantidad debe ser mayor a 0"),
  precioUnitario: z.number().positive().optional(),
  notas: z.string().trim().optional(),
});

export const crearPedidoSchema = z.object({
  mesaId: z.number().int().positive("Debe seleccionar una mesa"),
  turno: z.number().int().positive().optional(),
  mesaOrigenId: z.number().int().positive().optional(),
  nombreCliente: z.string().min(1, "Debe ingresar el nombre del cliente para continuar"),
  items: z.array(itemSchema).min(1, "Debe incluir al menos un item"),
}).strict();

export const cambiarEstadoSchema = z.object({
  estado: z.enum(["recibido", "pendiente", "hecho", "finalizado", "cancelado"]),
}).strict();

export const actualizarItemsSchema = z.object({
  items: z.array(itemSchema).min(1, "Debe incluir al menos un item"),
  nuevoEstado: z.enum(["pendiente"]).optional(),
}).strict();

export const separarCuentaSchema = z.object({
  cuentas: z.array(z.array(itemSchema).min(1)).min(2, "Se requieren al menos 2 cuentas"),
}).strict();

export const unirMesasSchema = z.object({
  mesaOrigenId: z.number().int().positive("Debe seleccionar una mesa"),
}).strict();

export const cambiarMesaSchema = z.object({
  mesaId: z.number().int().positive("Debe seleccionar una mesa"),
}).strict();

export const abonoSchema = z.object({
  monto: z.number().positive("El monto debe ser mayor a 0"),
  metodoPagoId: z.number().int().positive("Debe seleccionar un método de pago"),
}).strict();

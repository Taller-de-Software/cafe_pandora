import { z } from "zod";

export const actualizarModoImpresionSchema = z.object({
  modoImpresion: z.enum(["real", "simulacion"]),
}).strict();

export const guardarPrinterConfigSchema = z.object({
  printerName: z.string().max(100).nullable().optional(),
  printerConnectionType: z.enum(["usb", "network", "serial"]).optional(),
  printerVendorId: z.number().int().nullable().optional(),
  printerProductId: z.number().int().nullable().optional(),
  printerAddress: z.string().max(45).nullable().optional(),
  printerNetPort: z.number().int().min(1).max(65535).optional(),
  printerSerialPort: z.string().max(50).nullable().optional(),
  printerBaudRate: z.number().int().optional(),
  printerEncoding: z.string().max(20).optional(),
}).strict();

export const guardarFrontendPortSchema = z.object({
  frontendPort: z.number().int().min(1).max(65535),
}).strict();

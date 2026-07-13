import { z } from "zod";

export const actualizarModoImpresionSchema = z.object({
  modoImpresion: z.enum(["real", "simulacion"]),
}).strict();

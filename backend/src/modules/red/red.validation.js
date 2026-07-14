import { z } from "zod";

export const testPortSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
}).strict();
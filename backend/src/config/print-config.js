import prisma from "./db.config.js";

export async function leerModoImpresion() {
  const config = await prisma.configuracion.findFirst();
  return config?.modoImpresion ?? "simulacion";
}

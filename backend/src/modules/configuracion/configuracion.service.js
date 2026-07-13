import prisma from "../../config/db.config.js";

export const obtenerModoImpresion = async () => {
  const config = await prisma.configuracion.findFirst();
  return { modoImpresion: config?.modoImpresion ?? "simulacion" };
};

export const actualizarModoImpresion = async (mode) => {
  await prisma.configuracion.upsert({
    where: { id: 1 },
    create: { modoImpresion: mode },
    update: { modoImpresion: mode },
  });
  return { modoImpresion: mode };
};

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function verificarYSeed() {
  const count = await prisma.usuario.count();
  if (count === 0) {
    const { default: seed } = await import("../../prisma/seed.js");
    await seed();
  }
}

export default prisma;

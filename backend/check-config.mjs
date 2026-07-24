import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const config = await p.configuracion.findFirst();
  console.log(JSON.stringify(config, null, 2));
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
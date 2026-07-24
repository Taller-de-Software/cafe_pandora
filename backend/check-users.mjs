import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const usuarios = await p.usuario.findMany({ select: { id: true, nombre: true, rol: true, pin: true } });
  console.log(JSON.stringify(usuarios.map(u => ({ ...u, pin: u.pin ? 'hashed' : null })), null, 2));
} catch (e) {
  console.error(e);
} finally {
  await p.$disconnect();
}
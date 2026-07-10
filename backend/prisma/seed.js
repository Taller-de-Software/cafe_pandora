import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const metodos = [
    { nombre: 'Efectivo' },
    { nombre: 'Transferencia', entidad: 'Nequi' },
    { nombre: 'Transferencia', entidad: 'Daviplata' },
    { nombre: 'Transferencia', entidad: 'Nu' },
    { nombre: 'Tarjeta' },
  ]

  for (const m of metodos) {
    const existing = await prisma.metodoPago.findFirst({
      where: { nombre: m.nombre, entidad: m.entidad ?? null },
    })
    if (!existing) {
      await prisma.metodoPago.create({
        data: { nombre: m.nombre, entidad: m.entidad ?? null },
      })
    }
  }
  console.log('Seed completado: métodos de pago creados.')
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

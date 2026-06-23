import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPin = await bcrypt.hash("1234", 10);

  await prisma.usuario.upsert({
    where: { rol: "administrador" },
    update: {},
    create: {
      rol: "administrador",
      pin: adminPin,
    },
  });

  await prisma.usuario.upsert({
    where: { rol: "mesero" },
    update: {},
    create: {
      rol: "mesero",
      pin: null,
    },
  });

  await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: "Bebidas" },
      update: {},
      create: { nombre: "Bebidas", tipo: "bebida" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Comidas" },
      update: {},
      create: { nombre: "Comidas", tipo: "platillo" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Postres" },
      update: {},
      create: { nombre: "Postres", tipo: "platillo" },
    }),
  ]);

  await prisma.producto.deleteMany();

  const productosData = [];
  for (const p of [
    { nombre: "Coca Cola", precio: 15, tipo: "bebida", categoria: "Bebidas" },
    { nombre: "Agua Natural", precio: 10, tipo: "bebida", categoria: "Bebidas" },
    { nombre: "Jugo de Naranja", precio: 18, tipo: "bebida", categoria: "Bebidas" },
    { nombre: "Café Americano", precio: 12, tipo: "bebida", categoria: "Bebidas" },
    { nombre: "Hamburguesa", precio: 45, tipo: "platillo", categoria: "Comidas" },
    { nombre: "Pizza Personal", precio: 55, tipo: "platillo", categoria: "Comidas" },
    { nombre: "Tacos (3)", precio: 35, tipo: "platillo", categoria: "Comidas" },
    { nombre: "Ensalada César", precio: 40, tipo: "platillo", categoria: "Comidas" },
    { nombre: "Pastel de Chocolate", precio: 25, tipo: "platillo", categoria: "Postres" },
    { nombre: "Helado", precio: 20, tipo: "platillo", categoria: "Postres" },
  ]) {
    const cat = await prisma.categoria.findUnique({ where: { nombre: p.categoria } });
    if (cat) {
      productosData.push({
        nombre: p.nombre,
        precio: p.precio,
        tipo: p.tipo,
        categoriaId: cat.id,
      });
    }
  }

  if (productosData.length > 0) {
    await prisma.producto.createMany({ data: productosData });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { numero: String(i) },
      update: {},
      create: {
        numero: String(i),
        ubicacion: i <= 5 ? "Interior" : "Terraza",
      },
    });
  }

  console.log("Seed completado exitosamente");
}

export default main;

if (process.argv[1]?.includes("seed")) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

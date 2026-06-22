import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const meseroPassword = await bcrypt.hash("mesero123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@pandora.com" },
    update: {},
    create: {
      nombre: "Admin",
      email: "admin@pandora.com",
      password: adminPassword,
      rol: "ADMIN",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "mesero@pandora.com" },
    update: {},
    create: {
      nombre: "Mesero Default",
      email: "mesero@pandora.com",
      password: meseroPassword,
      rol: "MESERO",
    },
  });

  await Promise.all([
    prisma.categoria.upsert({
      where: { nombre: "Bebidas" },
      update: {},
      create: { nombre: "Bebidas" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Comidas" },
      update: {},
      create: { nombre: "Comidas" },
    }),
    prisma.categoria.upsert({
      where: { nombre: "Postres" },
      update: {},
      create: { nombre: "Postres" },
    }),
  ]);

  await prisma.producto.deleteMany();

  const productosData = [];
  for (const p of [
    { nombre: "Coca Cola", precio: 15, categoria: "Bebidas" },
    { nombre: "Agua Natural", precio: 10, categoria: "Bebidas" },
    { nombre: "Jugo de Naranja", precio: 18, categoria: "Bebidas" },
    { nombre: "Café Americano", precio: 12, categoria: "Bebidas" },
    { nombre: "Hamburguesa", precio: 45, categoria: "Comidas" },
    { nombre: "Pizza Personal", precio: 55, categoria: "Comidas" },
    { nombre: "Tacos (3)", precio: 35, categoria: "Comidas" },
    { nombre: "Ensalada César", precio: 40, categoria: "Comidas" },
    { nombre: "Pastel de Chocolate", precio: 25, categoria: "Postres" },
    { nombre: "Helado", precio: 20, categoria: "Postres" },
  ]) {
    const cat = await prisma.categoria.findUnique({ where: { nombre: p.categoria } });
    if (cat) {
      productosData.push({
        nombre: p.nombre,
        precio: p.precio,
        categoriaId: cat.id,
      });
    }
  }

  if (productosData.length > 0) {
    await prisma.producto.createMany({ data: productosData });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { numero: i },
      update: {},
      create: { numero: i, estado: "DISPONIBLE" },
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

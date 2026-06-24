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
    { nombre: "Coca Cola", precio: 15, categoria: "Bebidas", descripcion: "Refresco de cola clásico 355ml" },
    { nombre: "Agua Natural", precio: 10, categoria: "Bebidas", descripcion: "Agua purificada 500ml" },
    { nombre: "Jugo de Naranja", precio: 18, categoria: "Bebidas", descripcion: "Jugo natural de naranja recién exprimido" },
    { nombre: "Café Americano", precio: 12, categoria: "Bebidas", descripcion: "Café americano suave y aromático" },
    { nombre: "Hamburguesa", precio: 45, categoria: "Comidas", descripcion: "Hamburguesa con queso, lechuga y tomate" },
    { nombre: "Pizza Personal", precio: 55, categoria: "Comidas", descripcion: "Pizza tamaño personal con ingredientes frescos" },
    { nombre: "Tacos (3)", precio: 35, categoria: "Comidas", descripcion: "Tres tacos de carne al pastor con piña" },
    { nombre: "Ensalada César", precio: 40, categoria: "Comidas", descripcion: "Ensalada César con pollo, crutones y aderezo" },
    { nombre: "Pastel de Chocolate", precio: 25, categoria: "Postres", descripcion: "Rebanada de pastel de chocolate con cobertura" },
    { nombre: "Helado", precio: 20, categoria: "Postres", descripcion: "Helado cremoso de vainilla con toppings" },
  ]) {
    const cat = await prisma.categoria.findUnique({ where: { nombre: p.categoria } });
    if (cat) {
      productosData.push({
        nombre: p.nombre,
        precio: p.precio,
        descripcion: p.descripcion ?? null,
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

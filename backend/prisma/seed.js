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

  const bebidas = await prisma.categoria.findUnique({ where: { nombre: "Bebidas" } });
  const comidas = await prisma.categoria.findUnique({ where: { nombre: "Comidas" } });
  const postres = await prisma.categoria.findUnique({ where: { nombre: "Postres" } });

  const subcategoriasData = [];
  if (bebidas) {
    subcategoriasData.push(
      { nombre: "Refrescos", categoriaId: bebidas.id },
      { nombre: "Jugos", categoriaId: bebidas.id },
      { nombre: "Cafés", categoriaId: bebidas.id },
    );
  }
  if (comidas) {
    subcategoriasData.push(
      { nombre: "Hamburguesas", categoriaId: comidas.id },
      { nombre: "Pizzas", categoriaId: comidas.id },
      { nombre: "Tacos", categoriaId: comidas.id },
      { nombre: "Ensaladas", categoriaId: comidas.id },
    );
  }
  if (postres) {
    subcategoriasData.push(
      { nombre: "Pasteles", categoriaId: postres.id },
      { nombre: "Helados", categoriaId: postres.id },
    );
  }

  for (const s of subcategoriasData) {
    await prisma.subcategoria.upsert({
      where: { nombre: s.nombre },
      update: {},
      create: s,
    });
  }

  await prisma.producto.deleteMany();

  const productosData = [];
  for (const p of [
    { nombre: "Coca Cola", precio: 15, categoria: "Bebidas", subcategoria: "Refrescos", descripcion: "Refresco de cola clásico 355ml", requierePreparacion: false },
    { nombre: "Agua Natural", precio: 10, categoria: "Bebidas", subcategoria: "Refrescos", descripcion: "Agua purificada 500ml", requierePreparacion: false },
    { nombre: "Jugo de Naranja", precio: 18, categoria: "Bebidas", subcategoria: "Jugos", descripcion: "Jugo natural de naranja recién exprimido", requierePreparacion: false },
    { nombre: "Café Americano", precio: 12, categoria: "Bebidas", subcategoria: "Cafés", descripcion: "Café americano suave y aromático", requierePreparacion: false },
    { nombre: "Hamburguesa", precio: 45, categoria: "Comidas", subcategoria: "Hamburguesas", descripcion: "Hamburguesa con queso, lechuga y tomate", requierePreparacion: true },
    { nombre: "Pizza Personal", precio: 55, categoria: "Comidas", subcategoria: "Pizzas", descripcion: "Pizza tamaño personal con ingredientes frescos", requierePreparacion: true },
    { nombre: "Tacos (3)", precio: 35, categoria: "Comidas", subcategoria: "Tacos", descripcion: "Tres tacos de carne al pastor con piña", requierePreparacion: true },
    { nombre: "Ensalada César", precio: 40, categoria: "Comidas", subcategoria: "Ensaladas", descripcion: "Ensalada César con pollo, crutones y aderezo", requierePreparacion: true },
    { nombre: "Pastel de Chocolate", precio: 25, categoria: "Postres", subcategoria: "Pasteles", descripcion: "Rebanada de pastel de chocolate con cobertura", requierePreparacion: true },
    { nombre: "Helado", precio: 20, categoria: "Postres", subcategoria: "Helados", descripcion: "Helado cremoso de vainilla con toppings", requierePreparacion: false },
  ]) {
    const cat = await prisma.categoria.findUnique({ where: { nombre: p.categoria } });
    const sub = p.subcategoria ? await prisma.subcategoria.findUnique({ where: { nombre: p.subcategoria } }) : null;
    if (cat) {
      productosData.push({
        nombre: p.nombre,
        precio: p.precio,
        descripcion: p.descripcion ?? null,
        requierePreparacion: p.requierePreparacion,
        categoriaId: cat.id,
        subcategoriaId: sub?.id ?? null,
      });
    }
  }

  if (productosData.length > 0) {
    await prisma.producto.createMany({ data: productosData });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { nombre: String(i) },
      update: {},
      create: {
        nombre: String(i),
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

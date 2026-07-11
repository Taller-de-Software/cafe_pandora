import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================
// DATOS DEL CATÁLOGO — Café Pandora
// Ejecutar una vez: node prisma/seed-catalogo.js
// ============================================================

const categorias = [
  {
    nombre: 'Bebidas',
    subcategorias: [
      {
        nombre: 'Café',
        productos: [
          { nombre: 'Espresso', precio: 4500, descripcion: 'Café espresso puro y concentrado' },
          { nombre: 'Americano', precio: 4500, descripcion: 'Espresso diluido con agua caliente' },
          { nombre: 'Campesino', precio: 5000, descripcion: 'Café campesino tradicional colombiano' },
          { nombre: 'Enanvenedo', precio: 11000, descripcion: 'Café con licor y crema' },
          { nombre: 'Chaqueta', precio: 6000, descripcion: 'Café con leche y aguardiente' },
          { nombre: 'Capuccino', precio: 8000, descripcion: 'Espresso con espuma de leche vaporizada' },
          { nombre: 'Capuccino con licor', precio: 11000, descripcion: 'Capuccino aromatizado con licor' },
          { nombre: 'Crema de Whisky', precio: 9000, descripcion: 'Café con crema y whisky' },
          { nombre: 'Capuccino vainilla', precio: 9000, descripcion: 'Capuccino con toque de vainilla' },
          { nombre: 'Macchiato', precio: 8000, descripcion: 'Espresso manchado con espuma de leche' },
          { nombre: 'Bombón', precio: 8000, descripcion: 'Espresso con leche condensada' },
          { nombre: 'Latte', precio: 10000, descripcion: 'Espresso con abundante leche vaporizada' },
          { nombre: 'Mokaccino', precio: 9000, descripcion: 'Café con chocolate y leche' },
          { nombre: 'Flat White', precio: 9000, descripcion: 'Doble espresso con microespuma de leche' },
        ],
      },
      {
        nombre: 'Bebidas calientes sin café',
        productos: [
          { nombre: 'Milo', precio: 7500, descripcion: 'Bebida de chocolate maltado caliente' },
          { nombre: 'Te Chai', precio: 9000, descripcion: 'Té especiado estilo chai con leche' },
          { nombre: 'Infusiones', precio: 7500, descripcion: 'Infusión de hierbas aromáticas' },
          { nombre: 'Chocolate en agua', precio: 6000, descripcion: 'Chocolate caliente preparado en agua' },
          { nombre: 'Chocolate en leche', precio: 7000, descripcion: 'Chocolate caliente preparado con leche' },
          { nombre: 'Maicenita', precio: 7500, descripcion: 'Bebida caliente de maíz dulce' },
        ],
      },
      {
        nombre: 'Bebidas frías a base de café',
        productos: [
          { nombre: 'Freddo', precio: 10000, descripcion: 'Café frío batido con hielo y leche' },
          { nombre: 'Granizado', precio: 13000, descripcion: 'Café granizado con hielo y crema' },
          { nombre: 'Granizado nevado', precio: 14000, descripcion: 'Granizado con crema batida extra' },
          { nombre: 'Affogato', precio: 13000, descripcion: 'Espresso vertido sobre helado de vainilla' },
          { nombre: 'Affogato con licor', precio: 16000, descripcion: 'Affogato con un toque de licor' },
        ],
      },
      {
        nombre: 'Malteadas',
        productos: [
          { nombre: 'Malteada Frutos Rojos', precio: 14000, descripcion: 'Malteada sabor frutos rojos' },
          { nombre: 'Malteada Oreo', precio: 14000, descripcion: 'Malteada con galleta Oreo' },
          { nombre: 'Malteada Chocolate', precio: 14000, descripcion: 'Malteada sabor chocolate' },
        ],
      },
      {
        nombre: 'Jugos',
        productos: [
          { nombre: 'Jugo en leche', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en agua', precio: 8000, descripcion: 'Jugo natural preparado con agua' },
        ],
      },
      {
        nombre: 'Frappes',
        productos: [
          { nombre: 'Frappes', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
        ],
      },
      {
        nombre: 'Otras bebidas',
        productos: [
          { nombre: 'Tamarindo Michelada', precio: 6000, descripcion: 'Michelada con salsa de tamarindo' },
          { nombre: 'Milo frío', precio: 8000, descripcion: 'Milo maltado servido frío' },
          { nombre: 'Te Chai frío', precio: 9500, descripcion: 'Té chai especiado servido frío' },
          { nombre: 'Botella con agua', precio: 2000, descripcion: 'Botella de agua pura' },
          { nombre: 'Coca-Cola', precio: 5000, descripcion: 'Gaseosa Coca-Cola' },
        ],
      },
      {
        nombre: 'Limonadas',
        productos: [
          { nombre: 'Limonada Cereza', precio: 9500, descripcion: 'Limonada natural con sabor a cereza' },
          { nombre: 'Limonada Coco', precio: 11000, descripcion: 'Limonada con leche de coco' },
          { nombre: 'Limonada Vino', precio: 15000, descripcion: 'Limonada con vino tinto' },
          { nombre: 'Limonada Piña Colada', precio: 12000, descripcion: 'Limonada con piña y coco' },
          { nombre: 'Limonada Natural', precio: 8000, descripcion: 'Limonada fresca natural' },
          { nombre: 'Limonada Hierbabuena', precio: 9000, descripcion: 'Limonada con hierbabuena fresca' },
        ],
      },
      {
        nombre: 'Sodas',
        productos: [
          { nombre: 'Soda Tamarindo', precio: 14000, descripcion: 'Soda italiana sabor tamarindo' },
          { nombre: 'Soda Lychee', precio: 14000, descripcion: 'Soda italiana sabor lychee' },
          { nombre: 'Soda Frutos Rojos', precio: 14000, descripcion: 'Soda italiana sabor frutos rojos' },
          { nombre: 'Soda Lulo', precio: 14000, descripcion: 'Soda italiana sabor lulo' },
          { nombre: 'Soda MaracuMango', precio: 14000, descripcion: 'Soda italiana sabor maracuyá mango' },
          { nombre: 'Soda Fresa Sandía', precio: 14000, descripcion: 'Soda italiana sabor fresa sandía' },
          { nombre: 'Soda Passion', precio: 15000, descripcion: 'Soda italiana sabor pasión' },
        ],
      },
      {
        nombre: 'Cervezas',
        productos: [
          { nombre: 'Club Colombia', precio: 6000, descripcion: 'Cerveza Club Colombia' },
          { nombre: 'Corona', precio: 7000, descripcion: 'Cerveza Corona' },
          { nombre: 'Águila Light', precio: 5000, descripcion: 'Cerveza Águila Light' },
          { nombre: 'Heineken', precio: 7000, descripcion: 'Cerveza Heineken' },
          { nombre: 'Poker', precio: 5000, descripcion: 'Cerveza Poker' },
        ],
      },
      {
        nombre: 'Cócteles',
        productos: [
          { nombre: 'Mojito', precio: 28000, descripcion: 'Cóctel clásico con ron, menta y limón' },
          { nombre: 'Piña Colada', precio: 25000, descripcion: 'Cóctel tropical con ron, piña y coco' },
          { nombre: 'Margarita', precio: 30000, descripcion: 'Cóctel de tequila con limón y triple sec' },
          { nombre: 'Tinto de Verano', precio: 18000, descripcion: 'Vino tinto con gaseosa y frutas' },
          { nombre: 'Gin Tonic', precio: 32000, descripcion: 'Gin con tónica y botánicos' },
        ],
      },
    ],
  },
  {
    nombre: 'Platos',
    subcategorias: [
      {
        nombre: 'Desayunos',
        productos: [
          { nombre: 'Huevo Omelette de arepa', precio: 18000, descripcion: 'Omelette servido sobre arepa crujiente' },
          { nombre: 'Huevos Napolitanos', precio: 17000, descripcion: 'Huevos estilo napolitano con salsa' },
          { nombre: 'Migas', precio: 18000, descripcion: 'Plato tradicional de migas con huevo' },
          { nombre: 'Montanero', precio: 18000, descripcion: 'Desayuno montanero completo' },
          { nombre: 'Tradicional', precio: 17000, descripcion: 'Desayuno tradicional colombiano' },
          { nombre: 'Waffles con fruta', precio: 17000, descripcion: 'Waffles frescos con frutas de temporada' },
        ],
      },
      {
        nombre: 'Panadería',
        productos: [
          { nombre: 'Pan queso', precio: 10000, descripcion: 'Pan artesanal relleno de queso' },
          { nombre: 'Dedos de queso x2', precio: 7000, descripcion: 'Dedos de masa rellenos de queso' },
          { nombre: 'Galleta New York', precio: 6000, descripcion: 'Galleta estilo New York con chispas' },
          { nombre: 'Pandeyuca', precio: 3500, descripcion: 'Pan de yuca tradicional' },
          { nombre: 'Torta zanahoria', precio: 10000, descripcion: 'Torta artesanal de zanahoria' },
          { nombre: 'Torta envinada', precio: 11000, descripcion: 'Torta envinada con frutas' },
          { nombre: 'Torta chocolate', precio: 11000, descripcion: 'Torta artesanal de chocolate' },
          { nombre: 'Torta maní', precio: 11000, descripcion: 'Torta artesanal de maní' },
          { nombre: 'Croissant', precio: 6000, descripcion: 'Croissant francés hojaldrado' },
        ],
      },
    ],
  },
]

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function main() {
  let catsCreadas = 0
  let subcatsCreadas = 0
  let prodsCreados = 0
  let prodsOmitidos = 0

  for (const cat of categorias) {
    const categoria = await prisma.categoria.upsert({
      where: { nombre: cat.nombre },
      update: {},
      create: { nombre: cat.nombre },
    })
    catsCreadas++

    for (const sub of cat.subcategorias) {
      if (sub.productos.length === 0) {
        console.log(`  ⏭  Subcategoría "${sub.nombre}" sin productos, creando subcategoría vacía...`)
        const subcat = await prisma.subcategoria.upsert({
          where: { nombre: sub.nombre },
          update: {},
          create: { nombre: sub.nombre, categoriaId: categoria.id },
        })
        subcatsCreadas++
        continue
      }

      const subcat = await prisma.subcategoria.upsert({
        where: { nombre: sub.nombre },
        update: {},
        create: { nombre: sub.nombre, categoriaId: categoria.id },
      })
      subcatsCreadas++

      for (const prod of sub.productos) {
        const existing = await prisma.producto.findFirst({
          where: { nombre: prod.nombre },
        })

        if (existing) {
          console.log(`  ⏭  Producto "${prod.nombre}" ya existe, saltando...`)
          prodsOmitidos++
          continue
        }

        await prisma.producto.create({
          data: {
            nombre: prod.nombre,
            descripcion: prod.descripcion,
            precio: prod.precio,
            requierePreparacion: true,
            habilitado: true,
            categoriaId: categoria.id,
            subcategoriaId: subcat.id,
          },
        })
        prodsCreados++
      }
    }
  }

  console.log('')
  console.log('========================================')
  console.log('  SEED DE CATÁLOGO COMPLETADO')
  console.log('========================================')
  console.log(`  Categorías creadas:     ${catsCreadas}`)
  console.log(`  Subcategorías creadas:  ${subcatsCreadas}`)
  console.log(`  Productos creados:      ${prodsCreados}`)
  console.log(`  Productos omitidos:     ${prodsOmitidos} (ya existían)`)
  console.log('========================================')
}

main()
  .catch((e) => {
    console.error('Error en seed de catálogo:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

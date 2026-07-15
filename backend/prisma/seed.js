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
        nombre: 'Bebidas calientes con Café',
        productos: [
          { nombre: 'Espresso', precio: 4500, descripcion: 'Café espresso puro y concentrado' },
          { nombre: 'Americano', precio: 4500, descripcion: 'Espresso diluido con agua caliente' },
          { nombre: 'Campesino', precio: 5000, descripcion: 'Café campesino tradicional colombiano' },
          { nombre: 'Envenenado', precio: 11000, descripcion: 'Café con licor y crema' },
          { nombre: 'Chaqueta', precio: 6000, descripcion: 'Café con leche y aguardiente' },
          { nombre: 'Capuccino', precio: 8000, descripcion: 'Espresso con espuma de leche vaporizada' },
          { nombre: 'Capuccino con licor', precio: 11000, descripcion: 'Capuccino aromatizado con licor' },
          { nombre: 'Capuccino vainilla', precio: 9000, descripcion: 'Capuccino con toque de vainilla' },
          { nombre: 'Macchiato', precio: 9000, descripcion: 'Espresso manchado con espuma de leche' },
          { nombre: 'Bombón', precio: 8000, descripcion: 'Espresso con leche condensada' },
          { nombre: 'Latte', precio: 8000, descripcion: 'Espresso con abundante leche vaporizada' },
          { nombre: 'Mokaccino', precio: 10000, descripcion: 'Café con chocolate y leche' },
          { nombre: 'Flat White', precio: 9000, descripcion: 'Doble espresso con microespuma de leche' },
        ],
      },
      {
        nombre: 'Bebidas calientes sin café',
        productos: [
          { nombre: 'Milo', precio: 7500, descripcion: 'Bebida de chocolate maltado caliente' },
          { nombre: 'Te Chai', precio: 9000, descripcion: 'Té especiado estilo chai con leche' },
          { nombre: 'Infusion de frutos rojos', precio: 7500, descripcion: 'Infusión de hierbas aromáticas' },
          { nombre: 'Infusion de frutos amarillos', precio: 7500, descripcion: 'Infusión de hierbas aromáticas' },
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
        nombre: 'Bebidas frias',
        productos: [
          { nombre: 'Malteada Frutos Rojos', precio: 14000, descripcion: 'Malteada sabor frutos rojos' },
          { nombre: 'Malteada Oreo', precio: 14000, descripcion: 'Malteada con galleta Oreo' },
          { nombre: 'Malteada Chocolate', precio: 14000, descripcion: 'Malteada sabor chocolate' },
          { nombre: 'Jugo en leche de fresa', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en leche de marracuyá', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en leche de mango', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en leche de mora', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en leche de lulo', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en leche de guanabana', precio: 9000, descripcion: 'Jugo natural preparado con leche' },
          { nombre: 'Jugo en agua', precio: 8000, descripcion: 'Jugo natural preparado con agua' },
          { nombre: 'Frappe de piña', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
          { nombre: 'Frappe de mora', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
          { nombre: 'Frappe de fresa', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
          { nombre: 'Frappe de maracuyá', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
          { nombre: 'Frappe de mango', precio: 9000, descripcion: 'Batido frío helado con sabores variados' },
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
        nombre: 'Sodas artesanales',
        productos: [
          { nombre: 'Soda Tamarindo', precio: 14000, descripcion: 'Soda italiana sabor tamarindo' },
          { nombre: 'Soda Lychee', precio: 14000, descripcion: 'Soda italiana sabor lychee' },
          { nombre: 'Soda Frutos Rojos', precio: 14000, descripcion: 'Soda italiana sabor frutos rojos' },
          { nombre: 'Soda Lulo', precio: 14000, descripcion: 'Soda italiana sabor lulo' },
          { nombre: 'Soda MaracuMango', precio: 14000, descripcion: 'Soda italiana sabor maracuyá mango' },
          { nombre: 'Soda Fresa Sandía', precio: 14000, descripcion: 'Soda italiana sabor fresa sandía' },
          { nombre: 'Soda Passion de maracuyá', precio: 15000, descripcion: 'Soda italiana sabor pasión' },
          { nombre: 'Soda Passion de amareto', precio: 15000, descripcion: 'Soda italiana sabor pasión' },
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
          { nombre: 'Artesanales', precio: 7000, descripcion: 'Cerveza Artesanales' },
        ],
      },
      {
        nombre: 'Cócteles',
        productos: [
          { nombre: 'Mojito', precio: 28000, descripcion: 'Cóctel clásico con ron, menta y limón' },
          { nombre: 'Piña Colada', precio: 25000, descripcion: 'Cóctel tropical con ron, piña y coco' },
          { nombre: 'Margarita', precio: 30000, descripcion: 'Cóctel de tequila con limón y triple sec' },
          { nombre: 'Tinto de Verano', precio: 18000, descripcion: 'Vino tinto con gaseosa y frutas' },
          { nombre: 'Gintonic', precio: 32000, descripcion: 'Gin con tónica y botánicos' },
        ],
      },
    ],
  },

 {
  nombre: 'Platillos',
  subcategorias: [
    {
      nombre: 'Arepas',
      productos: [
        { nombre: 'Arepas Con Carne', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Arepas Con Pollo', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Arepas Con Chicharron', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Arepas Con Costilla', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Arepas Mixta', precio: 16000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Tostones',
      productos: [
        { nombre: 'Tostones de Carne', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Tostones de Pollo', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Tostones de Paisa', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Tostones de Ranchero', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Tostones Mixto', precio: 16000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Waffles de Pandeyuca',
      productos: [
        { nombre: 'Waffles de Pandeyuca Mini', precio: 10000, descripcion: '', requierePreparacion: true },
        { nombre: 'Waffles de Pandeyuca Relleno Pollo', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Waffles de Pandeyuca Relleno Carne', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Waffles de Pandeyuca Relleno Hawaiano', precio: 16000, descripcion: '', requierePreparacion: true },
        { nombre: 'Waffles de Pandeyuca Queso y Bocadillo', precio: 14000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Empanadas',
      productos: [
        { nombre: 'Empanada Maiz', precio: 2200, descripcion: '', requierePreparacion: true },
        { nombre: 'Empanada Hojaldre de Carne', precio: 5000, descripcion: '', requierePreparacion: true },
        { nombre: 'Empanada Hojaldre de Pollo', precio: 5000, descripcion: '', requierePreparacion: true },
        { nombre: 'Empanada Hojaldre de Chicharron', precio: 5000, descripcion: '', requierePreparacion: true },
        { nombre: 'Empanada Hojaldre Ranchera', precio: 5000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Mini Pizza',
      productos: [
        { nombre: 'Mini Pizza Carne', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Mini Pizza Pollo', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Mini Pizza Paisa', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Mini Pizza Hawaiana', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Mini Pizza Mixta', precio: 15000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Sandwich',
      productos: [
        { nombre: 'Sandwich Carne', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Sandwich Chicharron', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Sandwich Hawaiano', precio: 15000, descripcion: '', requierePreparacion: true },
        { nombre: 'Sandwich Jamon y Queso', precio: 14000, descripcion: '', requierePreparacion: true },
        { nombre: 'Sandwich Pollo', precio: 15000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Desgranado',
      productos: [
        { nombre: 'Pollo Crispy', precio: 17000, descripcion: '', requierePreparacion: true },
        { nombre: 'Costilla Ahumada', precio: 17000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Para Compartir',
      productos: [
        { nombre: 'Plato de Chicharron', precio: 17000, descripcion: '', requierePreparacion: true },
        { nombre: 'Plato de Morcilla', precio: 17000, descripcion: '', requierePreparacion: true },
        { nombre: 'Ceviche de Chicharron', precio: 15000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Picadas',
      productos: [
        { nombre: 'Picada Personal', precio: 32000, descripcion: '', requierePreparacion: true },
        { nombre: 'Picada 2-3 Personas', precio: 60000, descripcion: '', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Antojitos',
      productos: [
        { nombre: 'Papas Explosion', precio: 18000, descripcion: 'Papa Criolla, Chorizo, Chicharron, lechuga y Quesos', requierePreparacion: true },
        { nombre: 'Mini Hamburguesas', precio: 22000, descripcion: 'Plato de 3 mini hamburguesas acompañadas de Papas', requierePreparacion: true },
        { nombre: 'Arepa Burger', precio: 16000, descripcion: 'Arepa, carne burger, piña dulce, platano maduro, ripio de papa, salsa de la casa y queso gratinado', requierePreparacion: true },
        { nombre: 'Burro', precio: 17000, descripcion: 'Carne, pollo o mixto. Lechuga, maicitos, tocineta, queso, guacamole y pico de gallo', requierePreparacion: true },
        { nombre: 'Papas Crispy', precio: 19000, descripcion: 'Papas en cubo, pollo crispy, guacamole, pico de Gallo, salsa, queso gratinado', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Desayunos',
      productos: [
        { nombre: 'Desayuno Montañero', precio: 18000, descripcion: 'Chorizo, Morcilla, Arepa, Aguacate, Huevo, Queso', requierePreparacion: true },
        { nombre: 'Desayuno Tradicional', precio: 17000, descripcion: 'Porcion de Fruta, Huevos al gusto, arepa, tocineta y queso cuajada', requierePreparacion: true },
        { nombre: 'Desayuno Waffles con Fruta', precio: 17000, descripcion: 'Waffles de Pandeyuca, acompañados de fruta de temporada y mermelada de mora', requierePreparacion: true },
        { nombre: 'Desayuno Huevo Pochado', precio: 18000, descripcion: 'Pan tostado o arepa, guacamole, tocineta y tomate cherry', requierePreparacion: true },
        { nombre: 'Desayuno Omelette', precio: 18000, descripcion: 'Jamon y queso, pan tostado con mantequilla y mermelada, fruta de temporada', requierePreparacion: true },
        { nombre: 'Desayuno Migas de Arepa', precio: 18000, descripcion: 'Queso cuajada, tocineta y fruta de temporada', requierePreparacion: true },
        { nombre: 'Huevos Napolitanos', precio: 17000, descripcion: 'Cama de salsa napolitana, pan tostado o arepa, queso y fruta de temporada', requierePreparacion: true },
      ],
    },
    {
      nombre: 'Panaderia',
      productos: [
        { nombre: 'Pan Queso', precio: 10000, descripcion: '', requierePreparacion: true },
        { nombre: 'Dedos de Queso x2', precio: 7000, descripcion: '', requierePreparacion: true },
        { nombre: 'Galletas New York', precio: 6000, descripcion: '', requierePreparacion: true },
        { nombre: 'Pandeyuca', precio: 3500, descripcion: '', requierePreparacion: true },
        { nombre: 'Torta Zanahoria', precio: 10000, descripcion: '', requierePreparacion: true },
        { nombre: 'Torta Envinada', precio: 11000, descripcion: '', requierePreparacion: true },
        { nombre: 'Torta Chocolate', precio: 11000, descripcion: '', requierePreparacion: true },
        { nombre: 'Torta Mani', precio: 11000, descripcion: '', requierePreparacion: true },
        { nombre: 'Croissant Arequipe', precio: 6000, descripcion: '', requierePreparacion: true },
        { nombre: 'Croissant Bocadillo', precio: 6000, descripcion: '', requierePreparacion: true },
        { nombre: 'Croissant Queso', precio: 6000, descripcion: '', requierePreparacion: true },
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

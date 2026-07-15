import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PRODUCTOS_DIR = path.resolve(__dirname, "../../uploads/productos");

const prisma = new PrismaClient();

function normalizar(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function main() {
  if (!fs.existsSync(PRODUCTOS_DIR)) {
    console.error("No existe el directorio:", PRODUCTOS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(PRODUCTOS_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
  });

  const productos = await prisma.producto.findMany({
    where: { imagenUrl: null },
  });
  if (productos.length === 0) {
    console.log("Todos los productos ya tienen imagen.");
    return;
  }

  const mapProductos = new Map(
    productos.map((p) => [normalizar(p.nombre), p])
  );

  let actualizados = 0;

  for (const file of files) {
    const baseName = path.parse(file).name;
    const key = normalizar(baseName);
    const prod = mapProductos.get(key);

    if (prod) {
      await prisma.producto.update({
        where: { id: prod.id },
        data: { imagenUrl: `/uploads/productos/${file}` },
      });
      actualizados++;
      console.log(`  ✔ ${prod.nombre} → ${file}`);
    }
  }

  if (actualizados > 0) {
    console.log(`\n✅ Actualizados: ${actualizados}`);
  } else {
    console.log("No se encontraron nuevos productos con imagen disponible.");
  }
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

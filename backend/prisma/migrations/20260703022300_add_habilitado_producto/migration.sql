-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "imagenUrl" TEXT,
    "requierePreparacion" BOOLEAN NOT NULL DEFAULT false,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "categoriaId" INTEGER NOT NULL,
    "subcategoriaId" INTEGER,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productos_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "subcategorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", "subcategoriaId") SELECT "categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", "subcategoriaId" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

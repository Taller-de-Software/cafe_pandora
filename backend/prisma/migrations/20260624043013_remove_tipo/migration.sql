/*
  Warnings:

  - You are about to drop the column `tipo` on the `categorias` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `productos` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL
);
INSERT INTO "new_categorias" ("id", "nombre") SELECT "id", "nombre" FROM "categorias";
DROP TABLE "categorias";
ALTER TABLE "new_categorias" RENAME TO "categorias";
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
CREATE TABLE "new_productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "imagenUrl" TEXT,
    "categoriaId" INTEGER NOT NULL,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio") SELECT "categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

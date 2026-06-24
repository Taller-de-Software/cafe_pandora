/*
  Warnings:

  - You are about to drop the column `descripcion` on the `categorias` table. All the data in the column will be lost.
  - You are about to drop the column `imagenUrl` on the `categorias` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL
);
INSERT INTO "new_categorias" ("id", "nombre", "tipo") SELECT "id", "nombre", "tipo" FROM "categorias";
DROP TABLE "categorias";
ALTER TABLE "new_categorias" RENAME TO "categorias";
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

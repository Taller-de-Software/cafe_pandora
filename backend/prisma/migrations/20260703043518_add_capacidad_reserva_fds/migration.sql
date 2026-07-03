-- CreateTable
CREATE TABLE "reservas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cliente" TEXT NOT NULL,
    "telefono" TEXT,
    "fecha" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "personas" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "mesaId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reservas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_mesas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'vacia',
    "personalizada" BOOLEAN NOT NULL DEFAULT false,
    "capacidad" INTEGER NOT NULL DEFAULT 4
);
INSERT INTO "new_mesas" ("estado", "id", "nombre", "personalizada", "ubicacion") SELECT "estado", "id", "nombre", "personalizada", "ubicacion" FROM "mesas";
DROP TABLE "mesas";
ALTER TABLE "new_mesas" RENAME TO "mesas";
CREATE UNIQUE INDEX "mesas_nombre_key" ON "mesas"("nombre");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

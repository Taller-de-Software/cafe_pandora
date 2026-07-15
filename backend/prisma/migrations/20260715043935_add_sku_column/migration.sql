-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_configuracion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modoImpresion" TEXT NOT NULL DEFAULT 'simulacion',
    "serverHost" TEXT NOT NULL DEFAULT '0.0.0.0',
    "serverPort" INTEGER NOT NULL DEFAULT 3001,
    "corsOrigins" TEXT DEFAULT 'http://localhost:5173,http://localhost:3000',
    "sessionTtlMin" INTEGER NOT NULL DEFAULT 600,
    "pinMaxAttempts" INTEGER NOT NULL DEFAULT 5,
    "pinLockoutMin" INTEGER NOT NULL DEFAULT 15,
    "offlineModeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "qrCodeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "printerVendorId" INTEGER,
    "printerProductId" INTEGER,
    "printerEncoding" TEXT NOT NULL DEFAULT 'CP858'
);
INSERT INTO "new_configuracion" ("id", "modoImpresion") SELECT "id", "modoImpresion" FROM "configuracion";
DROP TABLE "configuracion";
ALTER TABLE "new_configuracion" RENAME TO "configuracion";
CREATE TABLE "new_productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "imagenUrl" TEXT,
    "requierePreparacion" BOOLEAN NOT NULL DEFAULT false,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "sku" TEXT,
    "codigoBarras" TEXT,
    "atajo" TEXT,
    "favorito" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "categoriaId" INTEGER NOT NULL,
    "subcategoriaId" INTEGER,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productos_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "subcategorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("categoriaId", "descripcion", "habilitado", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", "subcategoriaId") SELECT "categoriaId", "descripcion", "habilitado", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", "subcategoriaId" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
CREATE UNIQUE INDEX "productos_sku_key" ON "productos"("sku");
CREATE UNIQUE INDEX "productos_codigoBarras_key" ON "productos"("codigoBarras");
CREATE UNIQUE INDEX "productos_atajo_key" ON "productos"("atajo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

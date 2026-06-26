/*
  Warnings:

  - You are about to drop the `detalle_pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `usuarioId` on the `caja_sesiones` table. All the data in the column will be lost.
  - You are about to drop the column `entidadBancaria` on the `facturas` table. All the data in the column will be lost.
  - You are about to drop the column `metodoPago` on the `facturas` table. All the data in the column will be lost.
  - You are about to drop the column `pagadoEn` on the `facturas` table. All the data in the column will be lost.
  - You are about to alter the column `impuestoConsumo` on the `facturas` table. The data in that column could be lost. The data in that column will be cast from `Boolean` to `Float`.
  - You are about to drop the column `numero` on the `mesas` table. All the data in the column will be lost.
  - You are about to drop the column `cerradoEn` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `recibidoEn` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `retiros_caja` table. All the data in the column will be lost.
  - You are about to drop the column `facturaId` on the `union_mesas` table. All the data in the column will be lost.
  - You are about to drop the column `unidoEn` on the `union_mesas` table. All the data in the column will be lost.
  - Added the required column `cajaSesionId` to the `facturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metodoPagoId` to the `facturas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `mesas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `retiros_caja` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "detalle_pedido";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "subcategorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "categoriaId" INTEGER NOT NULL,
    CONSTRAINT "subcategorias_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "entidad" TEXT
);

-- CreateTable
CREATE TABLE "detalles_pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "notas" TEXT,
    "pedidoId" INTEGER NOT NULL,
    "productoId" INTEGER NOT NULL,
    CONSTRAINT "detalles_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "detalles_pedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_caja_sesiones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baseInicial" REAL NOT NULL,
    "totalVentas" REAL NOT NULL DEFAULT 0,
    "totalEgresos" REAL NOT NULL DEFAULT 0,
    "totalEnCaja" REAL NOT NULL DEFAULT 0,
    "netoCajon" REAL NOT NULL DEFAULT 0,
    "apertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierre" DATETIME
);
INSERT INTO "new_caja_sesiones" ("apertura", "baseInicial", "cierre", "id", "netoCajon", "totalEgresos", "totalVentas") SELECT "apertura", "baseInicial", "cierre", "id", "netoCajon", "totalEgresos", "totalVentas" FROM "caja_sesiones";
DROP TABLE "caja_sesiones";
ALTER TABLE "new_caja_sesiones" RENAME TO "caja_sesiones";
CREATE TABLE "new_facturas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subtotal" REAL NOT NULL,
    "impuestoConsumo" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedidoId" INTEGER NOT NULL,
    "metodoPagoId" INTEGER NOT NULL,
    "cajaSesionId" INTEGER NOT NULL,
    CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_facturas" ("id", "impuestoConsumo", "pedidoId", "subtotal", "total") SELECT "id", "impuestoConsumo", "pedidoId", "subtotal", "total" FROM "facturas";
DROP TABLE "facturas";
ALTER TABLE "new_facturas" RENAME TO "facturas";
CREATE UNIQUE INDEX "facturas_pedidoId_key" ON "facturas"("pedidoId");
CREATE TABLE "new_mesas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'vacia',
    "personalizada" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_mesas" ("estado", "id", "personalizada", "ubicacion") SELECT "estado", "id", "personalizada", "ubicacion" FROM "mesas";
DROP TABLE "mesas";
ALTER TABLE "new_mesas" RENAME TO "mesas";
CREATE UNIQUE INDEX "mesas_nombre_key" ON "mesas"("nombre");
CREATE TABLE "new_pedidos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turno" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'recibido',
    "total" REAL,
    "mesaId" INTEGER NOT NULL,
    "mesaOrigenId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendienteEn" DATETIME,
    "hechoEn" DATETIME,
    "finalizadoEn" DATETIME,
    "canceladoEn" DATETIME,
    CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_mesaOrigenId_fkey" FOREIGN KEY ("mesaOrigenId") REFERENCES "mesas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pedidos" ("creadoEn", "estado", "hechoEn", "id", "mesaId", "mesaOrigenId", "pendienteEn", "turno", "usuarioId") SELECT "creadoEn", "estado", "hechoEn", "id", "mesaId", "mesaOrigenId", "pendienteEn", "turno", "usuarioId" FROM "pedidos";
DROP TABLE "pedidos";
ALTER TABLE "new_pedidos" RENAME TO "pedidos";
CREATE TABLE "new_productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "imagenUrl" TEXT,
    "requierePreparacion" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" INTEGER NOT NULL,
    "subcategoriaId" INTEGER,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "productos_subcategoriaId_fkey" FOREIGN KEY ("subcategoriaId") REFERENCES "subcategorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion") SELECT "categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion" FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";
CREATE TABLE "new_retiros_caja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tipo" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "retiradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cajaSesionId" INTEGER NOT NULL,
    CONSTRAINT "retiros_caja_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_retiros_caja" ("cajaSesionId", "id", "monto", "retiradoEn") SELECT "cajaSesionId", "id", "monto", "retiradoEn" FROM "retiros_caja";
DROP TABLE "retiros_caja";
ALTER TABLE "new_retiros_caja" RENAME TO "retiros_caja";
CREATE TABLE "new_union_mesas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mesaId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    CONSTRAINT "union_mesas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "union_mesas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_union_mesas" ("id", "mesaId", "pedidoId") SELECT "id", "mesaId", "pedidoId" FROM "union_mesas";
DROP TABLE "union_mesas";
ALTER TABLE "new_union_mesas" RENAME TO "union_mesas";
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL DEFAULT 'Sin nombre',
    "rol" TEXT NOT NULL,
    "pin" TEXT
);
INSERT INTO "new_usuarios" ("id", "pin", "rol") SELECT "id", "pin", "rol" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_rol_key" ON "usuarios"("rol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "subcategorias_nombre_key" ON "subcategorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_nombre_key" ON "metodos_pago"("nombre");

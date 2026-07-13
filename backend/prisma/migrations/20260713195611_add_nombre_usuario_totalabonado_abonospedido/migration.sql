-- CreateTable
CREATE TABLE "abonos_pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monto" REAL NOT NULL,
    "metodoPagoId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "abonos_pedido_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "abonos_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pedidos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turno" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'recibido',
    "total" REAL,
    "totalAbonado" REAL NOT NULL DEFAULT 0,
    "mesaId" INTEGER NOT NULL,
    "mesaOrigenId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pendienteEn" DATETIME,
    "hechoEn" DATETIME,
    "finalizadoEn" DATETIME,
    "canceladoEn" DATETIME,
    "fechaPago" DATETIME,
    CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_mesaOrigenId_fkey" FOREIGN KEY ("mesaOrigenId") REFERENCES "mesas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pedidos" ("canceladoEn", "creadoEn", "estado", "fechaPago", "finalizadoEn", "hechoEn", "id", "mesaId", "mesaOrigenId", "pendienteEn", "total", "turno", "usuarioId") SELECT "canceladoEn", "creadoEn", "estado", "fechaPago", "finalizadoEn", "hechoEn", "id", "mesaId", "mesaOrigenId", "pendienteEn", "total", "turno", "usuarioId" FROM "pedidos";
DROP TABLE "pedidos";
ALTER TABLE "new_pedidos" RENAME TO "pedidos";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_facturas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subtotal" REAL NOT NULL,
    "impuestoConsumo" REAL NOT NULL DEFAULT 0,
    "propina" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pedidoId" INTEGER NOT NULL,
    "metodoPagoId" INTEGER NOT NULL,
    "cajaSesionId" INTEGER NOT NULL,
    CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "facturas_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_facturas" ("cajaSesionId", "creadoEn", "id", "impuestoConsumo", "metodoPagoId", "pedidoId", "subtotal", "total") SELECT "cajaSesionId", "creadoEn", "id", "impuestoConsumo", "metodoPagoId", "pedidoId", "subtotal", "total" FROM "facturas";
DROP TABLE "facturas";
ALTER TABLE "new_facturas" RENAME TO "facturas";
CREATE UNIQUE INDEX "facturas_pedidoId_key" ON "facturas"("pedidoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

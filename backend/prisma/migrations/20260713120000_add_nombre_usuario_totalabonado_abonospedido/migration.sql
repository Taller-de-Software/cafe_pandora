-- AlterTable: Add nombre to usuarios
ALTER TABLE "usuarios" ADD COLUMN "nombre" TEXT NOT NULL DEFAULT '';

-- CreateIndex: Unique index for nombre
CREATE UNIQUE INDEX "usuarios_nombre_key" ON "usuarios"("nombre");

-- AlterTable: Add totalAbonado to pedidos
ALTER TABLE "pedidos" ADD COLUMN "totalAbonado" REAL NOT NULL DEFAULT 0;

-- CreateTable: abonos_pedido
CREATE TABLE "abonos_pedido" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monto" REAL NOT NULL,
    "metodoPagoId" INTEGER NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "abonos_pedido_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "abonos_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

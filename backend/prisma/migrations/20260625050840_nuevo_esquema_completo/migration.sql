-- Migración: nuevo esquema completo
-- Agrega campos del prototipo al backend

-- Facturas: agregar cambio
ALTER TABLE "facturas" ADD COLUMN "cambio" REAL;

-- CajaSesiones: agregar totalEnCaja (con DEFAULT 0, ya manejado en CREATE)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Caja Sesiones
CREATE TABLE "new_caja_sesiones" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "baseInicial" REAL NOT NULL,
    "totalVentas" REAL NOT NULL DEFAULT 0,
    "totalEgresos" REAL NOT NULL DEFAULT 0,
    "totalEnCaja" REAL NOT NULL DEFAULT 0,
    "netoCajon" REAL NOT NULL DEFAULT 0,
    "apertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierre" DATETIME,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "caja_sesiones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_caja_sesiones" ("apertura", "baseInicial", "cierre", "id", "netoCajon", "totalEgresos", "totalVentas", "totalEnCaja", "usuarioId")
SELECT "apertura", "baseInicial", "cierre", "id", "netoCajon", "totalEgresos", "totalVentas", "totalEnCaja", "usuarioId" FROM "caja_sesiones";
DROP TABLE "caja_sesiones";
ALTER TABLE "new_caja_sesiones" RENAME TO "caja_sesiones";

-- Mesas: agregar capacidad, meseroActualId, nombreCliente, fechaReserva, horaReserva, ocupadaDesde
CREATE TABLE "new_mesas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "estado" TEXT NOT NULL DEFAULT 'vacia',
    "personalizada" BOOLEAN NOT NULL DEFAULT false,
    "meseroActualId" INTEGER,
    "nombreCliente" TEXT,
    "fechaReserva" TEXT,
    "horaReserva" TEXT,
    "ocupadaDesde" DATETIME
);
INSERT INTO "new_mesas" ("estado", "id", "numero", "personalizada", "ubicacion", "capacidad", "meseroActualId", "nombreCliente", "fechaReserva", "horaReserva", "ocupadaDesde")
SELECT "estado", "id", "numero", "personalizada", "ubicacion", 4, NULL, NULL, NULL, NULL, NULL FROM "mesas";
DROP TABLE "mesas";
ALTER TABLE "new_mesas" RENAME TO "mesas";
CREATE UNIQUE INDEX "mesas_numero_key" ON "mesas"("numero");

-- Pedidos: nuevo flujo de estados (espera → preparacion → listo → caja → facturado + cancelado)
-- Se migran los estados anteriores y timestamps
CREATE TABLE "new_pedidos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "turno" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'espera',
    "tipo" TEXT,
    "total" REAL,
    "mesaId" INTEGER NOT NULL,
    "mesaOrigenId" INTEGER,
    "usuarioId" INTEGER NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "esperaEn" DATETIME,
    "preparacionEn" DATETIME,
    "listoEn" DATETIME,
    "cajaEn" DATETIME,
    "facturadoEn" DATETIME,
    "canceladoEn" DATETIME,
    CONSTRAINT "pedidos_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pedidos_mesaOrigenId_fkey" FOREIGN KEY ("mesaOrigenId") REFERENCES "mesas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pedidos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_pedidos" (
    "creadoEn", "estado", "id", "mesaId", "mesaOrigenId", "turno", "usuarioId",
    "tipo", "total", "esperaEn", "preparacionEn", "listoEn", "cajaEn", "facturadoEn", "canceladoEn"
)
SELECT
    p."creadoEn",
    CASE
        WHEN p."estado" = 'recibido' THEN 'espera'
        WHEN p."estado" = 'pendiente' THEN 'preparacion'
        WHEN p."estado" = 'hecho' AND f.id IS NOT NULL THEN 'facturado'
        WHEN p."estado" = 'hecho' AND f.id IS NULL THEN 'listo'
        WHEN p."estado" = 'cancelado' THEN 'cancelado'
        ELSE 'espera'
    END,
    p."id", p."mesaId", p."mesaOrigenId", p."turno", p."usuarioId",
    NULL, NULL,
    p."recibidoEn", p."pendienteEn", p."hechoEn", NULL,
    CASE WHEN f.id IS NOT NULL THEN f."pagadoEn" ELSE NULL END,
    p."cerradoEn"
FROM "pedidos" p
LEFT JOIN "facturas" f ON f."pedidoId" = p."id";
DROP TABLE "pedidos";
ALTER TABLE "new_pedidos" RENAME TO "pedidos";

-- Productos: agregar disponible
CREATE TABLE "new_productos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" REAL NOT NULL,
    "imagenUrl" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "requierePreparacion" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" INTEGER NOT NULL,
    CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_productos" ("categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", "disponible")
SELECT "categoriaId", "descripcion", "id", "imagenUrl", "nombre", "precio", "requierePreparacion", 1 FROM "productos";
DROP TABLE "productos";
ALTER TABLE "new_productos" RENAME TO "productos";

-- RetirosCaja: agregar descripcion y categoria
CREATE TABLE "new_retiros_caja" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL DEFAULT 'Sin descripción',
    "categoria" TEXT NOT NULL DEFAULT 'otro',
    "monto" REAL NOT NULL,
    "retiradoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cajaSesionId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "retiros_caja_cajaSesionId_fkey" FOREIGN KEY ("cajaSesionId") REFERENCES "caja_sesiones" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "retiros_caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_retiros_caja" ("cajaSesionId", "descripcion", "categoria", "id", "monto", "retiradoEn", "usuarioId")
SELECT "cajaSesionId", 'Sin descripción', 'otro', "id", "monto", "retiradoEn", "usuarioId" FROM "retiros_caja";
DROP TABLE "retiros_caja";
ALTER TABLE "new_retiros_caja" RENAME TO "retiros_caja";

-- Usuarios: agregar nombre
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL DEFAULT 'Usuario',
    "rol" TEXT NOT NULL,
    "pin" TEXT
);
INSERT INTO "new_usuarios" ("id", "nombre", "pin", "rol")
SELECT "id", COALESCE("rol", 'Usuario'), "pin", "rol" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_rol_key" ON "usuarios"("rol");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

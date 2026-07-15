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
    "frontendPort" INTEGER NOT NULL DEFAULT 5173,
    "printerName" TEXT,
    "printerConnectionType" TEXT NOT NULL DEFAULT 'usb',
    "printerVendorId" INTEGER,
    "printerProductId" INTEGER,
    "printerAddress" TEXT,
    "printerNetPort" INTEGER NOT NULL DEFAULT 9100,
    "printerSerialPort" TEXT,
    "printerBaudRate" INTEGER NOT NULL DEFAULT 9600,
    "printerEncoding" TEXT NOT NULL DEFAULT 'CP858'
);
INSERT INTO "new_configuracion" ("corsOrigins", "id", "modoImpresion", "offlineModeEnabled", "pinLockoutMin", "pinMaxAttempts", "printerEncoding", "printerProductId", "printerVendorId", "qrCodeEnabled", "serverHost", "serverPort", "sessionTtlMin") SELECT "corsOrigins", "id", "modoImpresion", "offlineModeEnabled", "pinLockoutMin", "pinMaxAttempts", "printerEncoding", "printerProductId", "printerVendorId", "qrCodeEnabled", "serverHost", "serverPort", "sessionTtlMin" FROM "configuracion";
DROP TABLE "configuracion";
ALTER TABLE "new_configuracion" RENAME TO "configuracion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

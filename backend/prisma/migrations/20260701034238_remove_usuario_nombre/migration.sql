-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "rol" TEXT NOT NULL,
    "pin" TEXT
);
INSERT INTO "new_usuarios" ("id", "pin", "rol") SELECT "id", "pin", "rol" FROM "usuarios";
DROP TABLE "usuarios";
ALTER TABLE "new_usuarios" RENAME TO "usuarios";
CREATE UNIQUE INDEX "usuarios_rol_key" ON "usuarios"("rol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

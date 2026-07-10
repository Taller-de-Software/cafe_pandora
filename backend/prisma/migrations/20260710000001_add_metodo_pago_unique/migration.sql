-- Drop the unique index on nombre alone
DROP INDEX "metodos_pago_nombre_key";

-- Create a composite unique index on (nombre, entidad) to allow multiple
-- entidad variants under the same payment method name (e.g. Transferencia → Nequi, Daviplata, Nu)
CREATE UNIQUE INDEX "metodos_pago_nombre_entidad_key" ON "metodos_pago"("nombre", "entidad");

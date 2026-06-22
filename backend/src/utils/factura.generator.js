import prisma from "../config/db.config.js";

export async function generarNumeroFactura() {
  const now = new Date();
  const year = now.getFullYear();
  const prefix = `FAC-${year}`;

  const ultimaFactura = await prisma.factura.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
  });

  let correlativo = 1;
  if (ultimaFactura) {
    const partes = ultimaFactura.numero.split("-");
    correlativo = parseInt(partes[2]) + 1;
  }

  return `${prefix}-${String(correlativo).padStart(4, "0")}`;
}

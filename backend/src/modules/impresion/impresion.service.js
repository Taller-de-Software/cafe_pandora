import prisma from "../../config/db.config.js";
import { printCocina, printPago, getLastPrinterError, closePrinterSafely } from "../../utils/printer.js";
import { generarPDFComanda, generarPDFRecibo } from "../../utils/pdfGenerator.js";
import { leerModoImpresion } from "../../config/print-config.js";

function crearError(statusCode, message, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (extra.codigo) error.codigo = extra.codigo;
  if (extra.sugerencia) error.sugerencia = extra.sugerencia;
  if (extra.detalleTecnico) error.detalleTecnico = extra.detalleTecnico;
  return error;
}

function crearErrorImpresionFallida() {
  const ultimoError = getLastPrinterError();
  return crearError(
    503,
    ultimoError?.mensaje || "No se pudo imprimir: la impresora no respondió.",
    {
      codigo: ultimoError?.codigo,
      sugerencia: ultimoError?.sugerencia,
      detalleTecnico: ultimoError?.detalleTecnico,
    }
  );
}

function formatFecha() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export const imprimirFacturaCocina = async (pedidoId) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      mesa: true,
      usuario: true,
      detalles: { include: { producto: true } },
    },
  });
  if (!pedido) throw crearError(404, "Pedido no encontrado");

  const data = {
    pedidoId: pedido.id,
    mesa: pedido.mesa?.nombre,
    mesero: pedido.usuario?.nombre || pedido.usuario?.rol || "Sin mesero",
    fecha: new Date(),
    items: pedido.detalles.map((d) => ({
      cantidad: d.cantidad,
      nombre: d.producto.nombre,
      nota: d.notas,
    })),
  };

  const modo = await leerModoImpresion();
  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA - COCINA]");
    const pdfUrl = await generarPDFComanda(data);
    return { pdfUrl };
  }

  const impreso = await printCocina(data);

  if (!impreso) {
    throw crearErrorImpresionFallida();
  }

  generarPDFComanda(data).catch(err => {
    console.error("⚠️ [PDF] No se pudo guardar el PDF de cocina:", err.message);
  });

  return { message: "Comanda de cocina impresa", pedidoId };
};

export const imprimirReciboPago = async (facturaId) => {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      pedido: {
        include: {
          mesa: true,
          usuario: true,
          detalles: { include: { producto: true } },
        },
      },
    },
  });
  if (!factura) throw crearError(404, "Factura no encontrada");

  const mesa = factura.pedido.mesa?.nombre;
  const items = factura.pedido.detalles.map((d) => ({
    cantidad: d.cantidad,
    nombre: d.producto.nombre,
    precio: d.precioUnitario,
  }));
  const subtotal = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
  const impuestoConsumo = Math.round(subtotal * 0.08);
  const data = {
    facturaId: factura.id,
    facturaNumero: `#${factura.id}`,
    mesa,
    fecha: new Date(),
    items,
    subtotal,
    impuestoConsumo,
    propina: factura.propina,
    total: factura.total,
  };

  const modo = await leerModoImpresion();
  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA - PAGO]");
    const pdfUrl = await generarPDFRecibo(data);
    return { pdfUrl };
  }

  const impreso = await printPago(data);

  if (!impreso) {
    throw crearErrorImpresionFallida();
  }

  generarPDFRecibo(data).catch(err => {
    console.error("⚠️ [PDF] No se pudo guardar el PDF de pago:", err.message);
  });

  return { message: "Recibo de pago impreso", facturaId: factura.id };
};

export const probarImpresora = async () => {
  const modo = await leerModoImpresion();
  if (modo === "simulacion") {
    console.log("🖨️  [IMPRESIÓN SIMULADA]");
    return { message: "Modo simulación activo" };
  }

  const { connectPrinter } = await import("../../utils/printer.js");
  let printer;
  try {
    printer = await connectPrinter();
    if (!printer) {
      throw crearError(503, "La configuración de impresión no permite conectar en este modo.");
    }
    return { message: "Impresora conectada exitosamente" };
  } catch (err) {
    if (err.statusCode) throw err;
    throw crearError(503, err.message, {
      codigo: err.codigo,
      sugerencia: err.sugerencia,
      detalleTecnico: err.detalleTecnico,
    });
  } finally {
    await closePrinterSafely(printer);
  }
};
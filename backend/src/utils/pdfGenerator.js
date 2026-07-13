import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACTURAS_DIR = path.join(__dirname, "../../../uploads/facturas");
const COMANDAS_DIR = path.join(__dirname, "../../../uploads/cocina");
const LOGO_PATH = path.join(__dirname, "../../../images/logo cafepandora sin fondo.png");

const PAPER_WIDTH_PT = 226.77;
const MARGIN_PT = 11.34;
const USABLE_WIDTH = PAPER_WIDTH_PT - MARGIN_PT * 2;
const LOGO_MAX_WIDTH_PT = 113.39;

const EMPRESA = {
  nombre: "PANDORA BISTRO CAFE BAR",
  nit: "NIT: 1053784676",
  ciudad: "Medellín",
};

function formatFecha(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatHora(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

function formatTimestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
}

function formatearMonto(monto) {
  return `$${Math.round(monto).toLocaleString("es-CO")}`;
}

function crearDoc() {
  const doc = new PDFDocument({
    size: [PAPER_WIDTH_PT, 800],
    margins: { top: MARGIN_PT, bottom: MARGIN_PT, left: MARGIN_PT, right: MARGIN_PT },
  });
  return doc;
}

function dibujarLogo(doc) {
  if (fs.existsSync(LOGO_PATH)) {
    const logoW = LOGO_MAX_WIDTH_PT;
    const logoX = MARGIN_PT + (USABLE_WIDTH - logoW) / 2;
    doc.image(LOGO_PATH, logoX, doc.y, { width: logoW });
    doc.moveDown(0.5);
  }
}

function dibujarEncabezado(doc) {
  dibujarLogo(doc);

  doc.font("Courier-Bold").fontSize(13).text(EMPRESA.nombre, MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.moveDown(0.2);
  doc.font("Courier").fontSize(8).text(EMPRESA.nit, MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.text(EMPRESA.ciudad, MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.moveDown(0.8);
  lineaSeparadora(doc);
  doc.moveDown(0.5);
}

function lineaSeparadora(doc) {
  doc.font("Courier").fontSize(7);
  doc.text("─".repeat(36), MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
}

function lineaDoble(doc) {
  doc.font("Courier").fontSize(7);
  doc.text("═".repeat(36), MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
}

function textoParLinea(doc, izq, der, opciones = {}) {
  const font = opciones.bold ? "Courier-Bold" : "Courier";
  const size = opciones.fontSize || 8;
  doc.font(font).fontSize(size);

  const anchoDisponible = USABLE_WIDTH;
  const derWidth = doc.widthOfString(der);
  const puntosPorChar = doc.widthOfString("M");
  const espaciosNecesarios = Math.max(1, Math.floor((anchoDisponible - doc.widthOfString(izq) - derWidth) / puntosPorChar));

  doc.text(`${izq}${" ".repeat(espaciosNecesarios)}${der}`, MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "left",
  });
}

function wrapText(doc, text, maxChars) {
  const lineas = [];
  let restante = text;
  while (restante.length > maxChars) {
    let corte = restante.lastIndexOf(" ", maxChars);
    if (corte <= 0) corte = maxChars;
    lineas.push(restante.slice(0, corte));
    restante = restante.slice(corte).trimStart();
  }
  lineas.push(restante);
  return lineas;
}

function dibujarProductosComanda(doc, items) {
  doc.moveDown(0.3);
  doc.font("Courier-Bold").fontSize(8).text("Cant  Producto", MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
  });
  lineaSeparadora(doc);
  doc.moveDown(0.3);

  doc.font("Courier").fontSize(8);
  for (const item of items) {
    const lineas = wrapText(doc, item.nombre, 28);
    const cantStr = `${item.cantidad}x`;
    doc.text(`${cantStr.padEnd(5)}${lineas[0]}`, MARGIN_PT, doc.y, {
      width: USABLE_WIDTH,
    });
    for (let i = 1; i < lineas.length; i++) {
      doc.text(`      ${lineas[i]}`, MARGIN_PT, doc.y, {
        width: USABLE_WIDTH,
      });
    }
    if (item.nota) {
      const notaLineas = wrapText(doc, item.nota, 28);
      for (const nl of notaLineas) {
        doc.font("Courier").fontSize(7).text(`      ${nl}`, MARGIN_PT, doc.y, {
          width: USABLE_WIDTH,
        });
      }
      doc.font("Courier").fontSize(8);
    }
  }
}

function dibujarProductosRecibo(doc, items) {
  doc.moveDown(0.3);
  doc.font("Courier-Bold").fontSize(8);
  textoParLinea(doc, "Cant  Producto", "Total");
  lineaSeparadora(doc);
  doc.moveDown(0.3);

  doc.font("Courier").fontSize(8);
  for (const item of items) {
    const totalItem = formatearMonto(item.cantidad * item.precio);
    const lineas = wrapText(doc, item.nombre, 22);
    const cantStr = `${item.cantidad}x`;
    textoParLinea(doc, `${cantStr.padEnd(5)}${lineas[0]}`, totalItem);
    for (let i = 1; i < lineas.length; i++) {
      doc.text(`      ${lineas[i]}`, MARGIN_PT, doc.y, {
        width: USABLE_WIDTH,
      });
    }
  }
}

function dibujarInfoVenta(doc, data) {
  doc.font("Courier").fontSize(8);
  textoParLinea(doc, `Fecha: ${formatFecha(data.fecha)}`, `Hora: ${formatHora(data.fecha)}`);
  if (data.mesa) {
    textoParLinea(doc, `Mesa: ${data.mesa}`, "");
  }
  if (data.cajero) {
    textoParLinea(doc, `Cajero: ${data.cajero}`, "");
  }
  if (data.metodoPago) {
    textoParLinea(doc, `Pago: ${data.metodoPago}`, "");
  }
  doc.moveDown(0.5);
  lineaSeparadora(doc);
  doc.moveDown(0.5);
}

function dibujarInfoCocina(doc, data) {
  doc.font("Courier").fontSize(8);
  textoParLinea(doc, `Pedido #${data.pedidoId}`, "");
  if (data.mesa) {
    textoParLinea(doc, `Mesa: ${data.mesa}`, "");
  }
  if (data.mesero) {
    textoParLinea(doc, `Mesero: ${data.mesero}`, "");
  }
  textoParLinea(doc, `Fecha: ${formatFecha(data.fecha)}`, `Hora: ${formatHora(data.fecha)}`);
  doc.moveDown(0.5);
  lineaSeparadora(doc);
  doc.moveDown(0.5);
}

function dibujarResumen(doc, data) {
  doc.moveDown(0.3);
  lineaSeparadora(doc);
  doc.moveDown(0.3);

  if (data.subtotal != null) {
    textoParLinea(doc, "Subtotal", formatearMonto(data.subtotal));
  }
  if (data.impuestoConsumo != null) {
    textoParLinea(doc, "Imp. Consumo 8%", formatearMonto(data.impuestoConsumo));
  }
  if (data.subtotal == null && data.total != null) {
    textoParLinea(doc, "Total", formatearMonto(data.total));
  }

  if (data.subtotal != null || data.impuestoConsumo != null) {
    doc.moveDown(0.3);
    lineaDoble(doc);
    doc.moveDown(0.3);
    textoParLinea(doc, "TOTAL", formatearMonto(data.total), { bold: true, fontSize: 10 });
  }

  doc.moveDown(0.3);
  lineaSeparadora(doc);
}

function dibujarPie(doc, mensaje) {
  doc.moveDown(1);
  doc.font("Courier").fontSize(7).fillColor("#555555");
  const lineas = wrapText(doc, mensaje || "Más que un lugar, una experiencia para tus sentidos.", 36);
  for (const l of lineas) {
    doc.text(l, MARGIN_PT, doc.y, { width: USABLE_WIDTH, align: "center" });
  }
  doc.moveDown(0.5);
  doc.font("Courier-Bold").fontSize(8).fillColor("#000000");
  doc.text("¡Gracias por su compra!", MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.moveDown(0.3);
  doc.fillColor("#000000");
}

export function generarPDFComanda(data) {
  if (!fs.existsSync(COMANDAS_DIR)) {
    fs.mkdirSync(COMANDAS_DIR, { recursive: true });
  }

  const filename = `cocina-${data.pedidoId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(COMANDAS_DIR, filename);
  const doc = crearDoc();
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  dibujarEncabezado(doc);

  doc.font("Courier-Bold").fontSize(10).text("COMANDO DE COCINA", MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.moveDown(0.5);

  dibujarInfoCocina(doc, data);
  dibujarProductosComanda(doc, data.items);

  dibujarPie(doc, null);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/cocina/${filename}`));
    stream.on("error", reject);
  });
}

export function generarPDFRecibo(data) {
  if (!fs.existsSync(FACTURAS_DIR)) {
    fs.mkdirSync(FACTURAS_DIR, { recursive: true });
  }

  const filename = `pago-${data.facturaId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(FACTURAS_DIR, filename);
  const doc = crearDoc();
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  dibujarEncabezado(doc);

  doc.font("Courier-Bold").fontSize(10).text("RECIBO DE PAGO", MARGIN_PT, doc.y, {
    width: USABLE_WIDTH,
    align: "center",
  });
  doc.moveDown(0.5);

  dibujarInfoVenta(doc, data);
  dibujarProductosRecibo(doc, data.items);
  dibujarResumen(doc, data);
  dibujarPie(doc, null);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/facturas/${filename}`));
    stream.on("error", reject);
  });
}

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACTURAS_DIR = path.join(__dirname, "../../../uploads/facturas");
const COMANDAS_DIR = path.join(__dirname, "../../../uploads/cocina");
const LOGO_PATH = path.join(__dirname, "../../../images/logo cafepandora sin fondo.png");

const PAGE_WIDTH = 226.8;
const LEFT_MARGIN = 10;
const RIGHT_MARGIN = PAGE_WIDTH - 10;
const CONTENT_WIDTH = RIGHT_MARGIN - LEFT_MARGIN;
const LINE_HEIGHT = 20;
const FRASE_MARCA = 'Más que un lugar, una experiencia para tus sentidos.';

function formatFecha() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
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

function calcComandaHeight(data) {
  let h = 60;
  for (const item of data.items) {
    h += LINE_HEIGHT;
    if (item.nota) h += 14;
  }
  return h + 30;
}

function calcReciboHeight(data) {
  let h = 40;
  h += 70;
  h += data.items.length * 18;
  h += 105;
  return h;
}

export function generarPDFComanda(data) {
  if (!fs.existsSync(COMANDAS_DIR)) {
    fs.mkdirSync(COMANDAS_DIR, { recursive: true });
  }

  const filename = `cocina-${data.pedidoId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(COMANDAS_DIR, filename);
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, calcComandaHeight(data)],
    margin: 10,
  });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text(`MESA: ${data.mesa}`, { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(9).font("Helvetica");
  doc.text(`Fecha: ${data.fecha}`, { align: "center" });
  doc.text(`Hora: ${data.hora}`, { align: "center" });

  doc.moveDown(0.5);
  drawDivider(doc);

  for (const item of data.items) {
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text(`${item.nombre} — ${item.cantidad}`);
    if (item.nota) {
      doc.fontSize(8).font("Helvetica-Oblique");
      doc.text(`  Nota: ${item.nota}`);
    }
    doc.moveDown(0.2);
  }

  doc.moveDown(0.3);
  drawDivider(doc);

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/cocina/${filename}`));
    stream.on("error", reject);
  });
}

export async function generarPDFRecibo(data) {
  if (!fs.existsSync(FACTURAS_DIR)) {
    fs.mkdirSync(FACTURAS_DIR, { recursive: true });
  }

  const filename = `pago-${data.facturaId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(FACTURAS_DIR, filename);
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, calcReciboHeight(data)],
    margin: 10,
  });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  if (fs.existsSync(LOGO_PATH)) {
    try {
      const imgWidth = 65;
      const cx = (PAGE_WIDTH - imgWidth) / 2;
      const bwBuffer = await sharp(LOGO_PATH).grayscale().threshold(128).png().toBuffer();
      doc.image(bwBuffer, cx, doc.y, { width: imgWidth });
      doc.moveDown(1.2);
    } catch (err) {
      console.error("Error al cargar el logo:", LOGO_PATH, err.message);
    }
  } else {
    console.error("Logo no encontrado en:", LOGO_PATH);
  }

  doc.fontSize(11).font("Helvetica");
  doc.text("PANDORA BISTRO-CAFÉ BAR", { align: "center" });
  doc.moveDown(0.2);
  doc.fontSize(9).font("Helvetica");
  doc.text("NIT: 1053784676", { align: "center" });
  doc.text("Mall Combia", { align: "center" });
  doc.moveDown(0.3);
  doc.text(formatFecha(), { align: "center" });
  doc.text(`Mesa: ${data.mesa}  ·  ${data.metodoPago}`, { align: "center" });

  doc.moveDown(0.3);
  drawDivider(doc);

  const NAME_COL = CONTENT_WIDTH * 0.50;
  const QTY_COL = CONTENT_WIDTH * 0.15;
  const PRICE_COL = CONTENT_WIDTH * 0.35;
  const QTY_X = LEFT_MARGIN + NAME_COL;
  const PRICE_X = QTY_X + QTY_COL;

  for (const item of data.items) {
    const totalItem = formatearMonto(item.cantidad * item.precio);
    const itemY = doc.y;
    doc.fontSize(9).font("Helvetica");
    doc.text(item.nombre, LEFT_MARGIN, itemY, {
      align: "left", width: NAME_COL,
    });
    const afterNameY = doc.y;
    doc.text(`x${item.cantidad}`, QTY_X, itemY, {
      align: "center", width: QTY_COL,
    });
    doc.text(totalItem, PRICE_X, itemY, {
      align: "right", width: PRICE_COL,
    });
    doc.y = afterNameY;
  }

  doc.moveDown(0.2);
  drawDivider(doc);

  doc.fontSize(9).font("Helvetica");
  const subY = doc.y;
  doc.text("Subtotal", LEFT_MARGIN, subY, { align: "left", width: CONTENT_WIDTH });
  doc.text(formatearMonto(data.subtotal), LEFT_MARGIN, subY, { align: "right", width: CONTENT_WIDTH });
  doc.y = subY + 14;
  const taxY = doc.y;
  doc.text("Impuesto Consumo 8%", LEFT_MARGIN, taxY, { align: "left", width: CONTENT_WIDTH });
  doc.text(formatearMonto(data.impuesto), LEFT_MARGIN, taxY, { align: "right", width: CONTENT_WIDTH });
  doc.y = taxY + 14;

  doc.moveDown(0.2);
  drawDivider(doc);

  const totalY = doc.y;
  doc.fontSize(11).font("Helvetica");
  doc.text("TOTAL", LEFT_MARGIN, totalY, { align: "left", width: CONTENT_WIDTH });
  doc.text(formatearMonto(data.total), LEFT_MARGIN, totalY, { align: "right", width: CONTENT_WIDTH });
  doc.y = totalY + 16;

  doc.moveDown(0.5);
  doc.fontSize(8).font("Helvetica-Oblique");
  if (FRASE_MARCA) doc.text(FRASE_MARCA, { align: "center" });
  doc.font("Helvetica");
  doc.moveDown(0.3);
  doc.text("¡Gracias por su compra!", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/facturas/${filename}`));
    stream.on("error", reject);
  });
}

function drawDivider(doc) {
  const y = doc.y + 3;
  doc.moveTo(LEFT_MARGIN, y).lineTo(RIGHT_MARGIN, y).lineWidth(0.5).stroke("#888888");
  doc.y = y + 6;
}



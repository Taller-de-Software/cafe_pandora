import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FACTURAS_DIR = path.join(__dirname, "../../uploads/facturas");

function formatFecha(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
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
  return `$${Number(monto).toFixed(2)} MXN`;
}

function dibujarEncabezado(doc) {
  doc.fontSize(20).font("Helvetica-Bold").text("PANDORA CAFÉ BAR", { align: "center" });
  doc.moveDown(0.3);
  doc.fontSize(10).font("Helvetica").text("Calle Principal #123, Col. Centro", { align: "center" });
  doc.text("Tel: (123) 456-7890", { align: "center" });
  doc.moveDown(0.5);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);
}

function dibujarTabla(doc, headers, rows, startY) {
  const colWidths = [40, 280, 80, 100];
  const rowHeight = 20;
  let y = startY;

  doc.fontSize(9).font("Helvetica-Bold");
  doc.rect(50, y, 500, rowHeight).fill("#2c3e50");
  doc.fill("#ffffff");

  let x = 55;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 5, { width: colWidths[i], align: i === 0 || i === 2 ? "center" : "left" });
    x += colWidths[i];
  });

  y += rowHeight;
  doc.fill("#000000").font("Helvetica").fontSize(9);

  rows.forEach((row, ri) => {
    if (ri % 2 === 0) {
      doc.rect(50, y, 500, rowHeight).fill("#f5f5f5");
      doc.fill("#000000");
    }

    x = 55;
    row.forEach((cell, ci) => {
      doc.text(String(cell), x, y + 5, {
        width: colWidths[ci],
        align: ci === 0 || ci === 2 ? "center" : "left",
      });
      x += colWidths[ci];
    });

    y += rowHeight;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke();
  return y;
}

export function generarPDFComanda(data) {
  if (!fs.existsSync(FACTURAS_DIR)) {
    fs.mkdirSync(FACTURAS_DIR, { recursive: true });
  }

  const filename = `cocina-${data.pedidoId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(FACTURAS_DIR, filename);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  dibujarEncabezado(doc);

  doc.fontSize(16).font("Helvetica-Bold").text("COMANDO DE COCINA", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(11).font("Helvetica");
  doc.text(`Pedido #${data.pedidoId}`);
  doc.text(`Mesa: ${data.mesa}`);
  doc.text(`Fecha: ${formatFecha()}`);
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  const headers = ["#", "Producto", "Cant.", "Notas"];
  const rows = data.items.map((item, i) => [
    String(i + 1),
    item.nombre,
    String(item.cantidad),
    item.nota || "-",
  ]);

  const endY = dibujarTabla(doc, headers, rows, doc.y);
  doc.y = endY + 20;

  doc.moveDown(1);
  doc.fontSize(9).font("Helvetica").fillColor("#888888");
  doc.text("Este es un documento generado automáticamente por Pandora Café Bar", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/facturas/${filename}`));
    stream.on("error", reject);
  });
}

export function generarPDFRecibo(data) {
  if (!fs.existsSync(FACTURAS_DIR)) {
    fs.mkdirSync(FACTURAS_DIR, { recursive: true });
  }

  const filename = `pago-${data.facturaId}-${formatTimestamp()}.pdf`;
  const filepath = path.join(FACTURAS_DIR, filename);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  dibujarEncabezado(doc);

  doc.fontSize(16).font("Helvetica-Bold").text("RECIBO DE PAGO", { align: "center" });
  doc.moveDown(1);

  doc.fontSize(11).font("Helvetica");
  doc.text(`Factura #${data.facturaId}`);
  doc.text(`Mesa: ${data.mesa}`);
  doc.text(`Fecha: ${formatFecha()}`);
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  const headers = ["#", "Producto", "Cant.", "Precio"];
  const rows = data.items.map((item, i) => [
    String(i + 1),
    item.nombre,
    String(item.cantidad),
    formatearMonto(item.precio),
  ]);

  const endY = dibujarTabla(doc, headers, rows, doc.y);
  doc.y = endY + 15;

  doc.fontSize(12).font("Helvetica-Bold");
  doc.text(`Total: ${formatearMonto(data.total)}`, { align: "right" });
  doc.moveDown(2);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(0.5);

  doc.fontSize(9).font("Helvetica").fillColor("#888888");
  doc.text("¡Gracias por su preferencia!", { align: "center" });
  doc.text("Este es un documento generado automáticamente por Pandora Café Bar", { align: "center" });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on("finish", () => resolve(`/uploads/facturas/${filename}`));
    stream.on("error", reject);
  });
}

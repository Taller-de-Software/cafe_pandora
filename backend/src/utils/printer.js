import { ThermalPrinter } from "node-thermal-printer";
import path from "path";
import { fileURLToPath } from "url";
import { formatearNumero } from "./formatear.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "../../../images/logo cafepandora sin fondo.png");

let printer = null;
const FRASE_MARCA = 'Más que un lugar, una experiencia para tus sentidos.';

function wrapTexto(texto, anchoMax) {
  const lineas = [];
  const palabras = texto.split(' ');
  let current = '';
  for (const palabra of palabras) {
    if (palabra.length > anchoMax) {
      if (current) { lineas.push(current); current = ''; }
      for (let i = 0; i < palabra.length; i += anchoMax) {
        lineas.push(palabra.substring(i, i + anchoMax));
      }
      continue;
    }
    const test = current ? `${current} ${palabra}` : palabra;
    if (test.length > anchoMax) {
      lineas.push(current);
      current = palabra;
    } else {
      current = test;
    }
  }
  if (current) lineas.push(current);
  return lineas.length ? lineas : [''];
}

export async function connectPrinter() {
  printer = new ThermalPrinter({
    type: "epson",
    interface: process.env.PRINTER_INTERFACE || "USB001",
    width: 48,
    characterSet: "PC850",
    removeSpecialCharacters: false,
  });
  const connected = await printer.isPrinterConnected();
  if (!connected) {
    throw new Error("No se pudo conectar con la impresora térmica");
  }
}

export async function printCocina(data) {
  printer.alignCenter();
  printer.println(`MESA: ${data.mesa}`);
  printer.println(`Fecha: ${data.fecha}`);
  printer.println(`Hora: ${data.hora}`);
  printer.newLine();
  printer.drawLine();
  printer.newLine();
  printer.alignLeft();

  for (const item of data.items) {
    printer.bold(true);
    printer.println(`${item.nombre} — ${item.cantidad}`);
    printer.bold(false);
    if (item.nota) {
      printer.println(`  Nota: ${item.nota}`);
    }
  }

  printer.newLine();
  printer.drawLine();
  printer.newLine();
  printer.cut();
  await printer.execute();
}

export async function printPago(data) {
  printer.alignCenter();
  try {
    await printer.printImage(LOGO_PATH);
    printer.newLine();
  } catch (err) {
    console.error("Error al cargar el logo:", LOGO_PATH, err.message);
  }
  printer.println("PANDORA BISTRO-CAFÉ BAR");
  printer.println("NIT: 1053784676");
  printer.println("Mall Combia");
  printer.println(`${data.fecha}`);
  printer.println(`Mesa: ${data.mesa}  ·  ${data.metodoPago}`);
  printer.newLine();
  printer.drawLine();
  printer.newLine();
  printer.alignLeft();

  for (const item of data.items) {
    const nameLines = wrapTexto(item.nombre, 24);
    const qtyStr = `x${item.cantidad}`;
    const priceStr = `$${formatearNumero(item.cantidad * item.precio)}`;
    const qtyPad = Math.floor((6 - qtyStr.length) / 2);
    const paddedQty = ' '.repeat(qtyPad) + qtyStr + ' '.repeat(6 - qtyStr.length - qtyPad);
    const paddedPrice = priceStr.padStart(18);
    printer.println(nameLines[0].padEnd(24) + paddedQty + paddedPrice);
    for (let i = 1; i < nameLines.length; i++) {
      printer.println(nameLines[i].padEnd(24) + ' '.repeat(24));
    }
  }

  printer.newLine();
  printer.drawLine();
  printer.newLine();
  printer.alignRight();
  printer.leftRight(`$${formatearNumero(data.subtotal)}`, "Subtotal");
  printer.leftRight(`$${formatearNumero(data.impuesto)}`, "Impuesto Consumo 8%");
  printer.newLine();
  printer.drawLine();
  printer.newLine();
  printer.leftRight("TOTAL", `$${formatearNumero(data.total)}`);
  printer.newLine();
  if (FRASE_MARCA) {
    printer.alignCenter();
    printer.println(FRASE_MARCA);
  }
  printer.alignCenter();
  printer.println("¡Gracias por su compra!");
  printer.newLine();
  printer.cut();
  await printer.execute();
}

export function disconnectPrinter() {
  printer = null;
}

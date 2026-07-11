const VALID_MODES = ["simulate", "real"];

let currentMode = process.env.PRINT_MODE || "simulate";

if (!VALID_MODES.includes(currentMode)) {
  currentMode = "simulate";
}

export function getPrintMode() {
  return currentMode;
}

export function setPrintMode(mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Modo inválido: "${mode}". Usa "simulate" o "real".`);
  }
  currentMode = mode;
  console.log(`🖨️  Modo de impresión cambiado a: ${mode}`);
}

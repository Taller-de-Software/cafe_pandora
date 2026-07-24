import { detect as detectUsb } from './usb.detector.js';

/**
 * Ejecuta los detectores disponibles según la plataforma.
 * En Windows: solo lista impresoras instaladas vía WMI.
 * En otras plataformas: ejecuta todos los detectores disponibles.
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detectAllPrinters() {
  const results = [];

  // En Windows, solo interesa detectar impresoras del Spooler
  if (process.platform === 'win32') {
    try {
      const printers = await detectUsb();
      results.push(...printers);
    } catch (err) {
      console.error('[DETECTOR] Error in usb:', err);
    }
    return results;
  }

  // En otras plataformas, ejecutar detectores adicionales
  const detectors = [];

  try {
    const { detect: detectSerial } = await import('./serial.detector.js');
    detectors.push({ name: 'serial', fn: detectSerial });
  } catch {}

  try {
    const { detect: detectNetwork } = await import('./network.detector.js');
    detectors.push({ name: 'network', fn: detectNetwork });
  } catch {}

  try {
    const { detect: detectCups } = await import('./cups.detector.js');
    detectors.push({ name: 'cups', fn: detectCups });
  } catch {}

  const detections = await Promise.allSettled(
    detectors.map(async (d) => {
      try {
        return await d.fn();
      } catch (err) {
        console.error(`[DETECTOR] Error in ${d.name}:`, err);
        return [];
      }
    })
  );

  for (const result of detections) {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    }
  }

  return results;
}

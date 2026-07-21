import { detect as detectUsb } from './usb.detector.js';
import { detect as detectSerial } from './serial.detector.js';
import { detect as detectNetwork } from './network.detector.js';
import { detect as detectCups } from './cups.detector.js';

/**
 * Ejecuta todos los detectores y retorna una lista unificada.
 * @returns {Promise<import('../printer.types.js').DetectedPrinter[]>}
 */
export async function detectAllPrinters() {
  const results = [];
  const detectors = [
    { name: 'usb', fn: detectUsb },
    { name: 'serial', fn: detectSerial },
    { name: 'network', fn: detectNetwork },
    { name: 'cups', fn: detectCups },
  ];

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

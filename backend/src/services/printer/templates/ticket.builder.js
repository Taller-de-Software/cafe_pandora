const LINE_WIDTH = 32;

function padLine(text, totalWidth = LINE_WIDTH) {
  if (text.length >= totalWidth) return text.slice(0, totalWidth);
  return text + ' '.repeat(totalWidth - text.length);
}

function centerLine(text, totalWidth = LINE_WIDTH) {
  if (text.length >= totalWidth) return text.slice(0, totalWidth);
  const leftPad = Math.floor((totalWidth - text.length) / 2);
  return ' '.repeat(leftPad) + text;
}

function formatCurrency(n) {
  return Math.round(n).toLocaleString('es-CO');
}

function separator() {
  return '-'.repeat(LINE_WIDTH);
}

/**
 * Genera ticket de comanda de cocina.
 * @param {import('../printer.types.js').CocinaTicketData} data
 * @returns {string}
 */
export function buildCocinaTicket(data) {
  const lines = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  lines.push('');
  lines.push(centerLine('COMANDA DE COCINA'));
  lines.push(separator());
  lines.push(padLine(`Mesa: ${data.mesa || '-'}`));
  lines.push(padLine(`${fecha} ${hora}`));
  lines.push(padLine(`Pedido #${data.pedidoId}`));
  if (data.mozo) lines.push(padLine(`Mozo: ${data.mozo}`));
  lines.push(separator());

  for (const item of data.items) {
    const qty = item.quantity?.toString() || '1';
    lines.push(padLine(`${qty}x  ${item.name}`));
    if (item.note) lines.push(padLine(`   (${item.note})`));
  }

  lines.push(separator());
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Genera ticket de recibo de pago.
 * @param {import('../printer.types.js').PagoTicketData} data
 * @returns {string}
 */
export function buildPagoTicket(data) {
  const lines = [];
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const fmt = formatCurrency;

  lines.push('');
  lines.push(centerLine('PANDORA BISTRO CAFE BAR'));
  lines.push(centerLine('NIT: 1053784676'));
  lines.push(padLine('Mall Combia'));
  lines.push(padLine('Correo: 0'));
  lines.push(padLine('Telefono: 0'));
  lines.push(separator());
  lines.push(centerLine('RECIBO DE PAGO'));
  lines.push(separator());
  lines.push(padLine(`Fecha: ${fecha}  Hora: ${hora}`));
  lines.push(padLine(`Mesa: ${data.mesa || '-'}`));
  lines.push(separator());
  lines.push(padLine('Cant  Producto           Total'));
  lines.push(separator());

  for (const item of data.items) {
    const qty = item.quantity?.toString() || '1';
    const name = item.name || '';
    const price = item.unitPrice || 0;
    const lineTotal = price * Number(qty);
    const line = `${qty}x  ${name}`;
    const priceStr = `$${fmt(lineTotal)}`;
    const pad = LINE_WIDTH - line.length - priceStr.length;
    lines.push(pad > 0 ? line + ' '.repeat(pad) + priceStr : line + ' ' + priceStr);
  }

  lines.push(separator());
  lines.push(padLine(`Subtotal:        $${fmt(data.subtotal)}`));

  lines.push(padLine(`Imp. Consumo 8%: $${fmt(data.impuestoConsumo)}`));
  lines.push(padLine(`Propina:         $${fmt(data.propina)}`));

  lines.push(centerLine(`TOTAL:           $${fmt(data.total)}`));
  lines.push(separator());
  lines.push(centerLine('ADVERTENCIA PROPINA'));
  lines.push(centerLine('Se sugiere una propina'));
  lines.push(centerLine('correspondiente al 10% del'));
  lines.push(centerLine('valor de la cuenta, la cual'));
  lines.push(centerLine('podra ser aceptada,'));
  lines.push(centerLine('modificada o rechazada por'));
  lines.push(centerLine('usted.'));
  lines.push('');
  lines.push(centerLine('Mas que un lugar, una experiencia'));
  lines.push(centerLine('para tus sentidos.'));
  lines.push(centerLine('Gracias por su compra!'));
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

/**
 * Genera ticket de cierre de caja.
 * @param {import('../printer.types.js').CierreTicketData} data
 * @returns {string}
 */
export function buildCierreTicket(data) {
  const lines = [];
  const fmt = formatCurrency;

  lines.push('');
  lines.push('='.repeat(LINE_WIDTH));
  lines.push(centerLine('CIERRE DE CAJA - CAFE PANDORA'));
  lines.push('='.repeat(LINE_WIDTH));
  lines.push('');
  lines.push(padLine(`Fecha: ${new Date().toLocaleDateString('es-AR')}`));
  lines.push(padLine(`Hora: ${new Date().toLocaleTimeString('es-AR')}`));
  lines.push(padLine(`Turno: ${data.turno ?? '-'}`));
  lines.push(padLine(`Usuario: ${data.usuario ?? '-'}`));
  lines.push('');
  lines.push(separator());
  lines.push(padLine(`  Ventas: $${fmt(data.ventas)}`));
  lines.push(padLine(`  Gastos: $${fmt(data.gastos)}`));
  lines.push(padLine(`  Diferencia: $${fmt(data.diferencia)}`));
  lines.push(separator());

  if (data.observaciones) {
    lines.push(padLine(`Obs: ${data.observaciones}`));
  }

  lines.push('');
  lines.push('='.repeat(LINE_WIDTH));
  lines.push('');
  lines.push('');
  lines.push('');

  return lines.join('\n');
}

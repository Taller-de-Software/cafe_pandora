import { EscposBuffer } from './escpos-buffer.js';

const LINE_WIDTH = 32;

function formatCurrency(n) {
  return Math.round(n).toLocaleString('es-CO');
}

export function buildCocinaTicket(data, encoding = 'CP437') {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const p = new EscposBuffer(encoding)
    .init()
    .align(1).bold(true).text('COMANDA DE COCINA').bold(false)
    .align(0)
    .text(`Mesa: ${data.mesa || '-'}`)
    .text(`${fecha} ${hora}`)
    .text(`Pedido #${data.pedidoId}`);

  if (data.mozo) p.text(`Mozo: ${data.mozo}`);

  p.separator('-');

  for (const item of data.items) {
    const qty = item.quantity?.toString() || '1';
    p.size(2, 1).text(`${qty}x  ${item.name}`).size(1, 1);
    if (item.note) p.text(`   (${item.note})`);
  }

  return p
    .separator('-')
    .feed(5)
    .cut()
    .build();
}

export function buildPagoTicket(data, encoding = 'CP437') {
  const now = new Date();
  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const fmt = formatCurrency;

  const p = new EscposBuffer(encoding)
    .init()
    .align(1).size(2, 1).bold(true).text('PANDORA BISTRO CAFE BAR')
    .size(1, 1).bold(false)
    .text('NIT: 1053784676')
    .text('Mall Combia')
    .text('Correo: 0')
    .text('Telefono: 0')
    .separator('-')
    .bold(true).text('RECIBO DE PAGO').bold(false)
    .align(0)
    .separator('-')
    .text(`Fecha: ${fecha}  Hora: ${hora}`)
    .text(`Mesa: ${data.mesa || '-'}`)
    .separator('-')
    .bold(true).text('Cant  Producto           Total').bold(false)
    .separator('-');

  for (const item of data.items) {
    const qty = item.quantity?.toString() || '1';
    const name = item.name || '';
    const price = item.unitPrice || 0;
    const lineTotal = price * Number(qty);
    const line = `${qty}x  ${name}`;
    const priceStr = `$${fmt(lineTotal)}`;
    const pad = LINE_WIDTH - line.length - priceStr.length;
    p.text(pad > 0 ? line + ' '.repeat(pad) + priceStr : line + ' ' + priceStr);
  }

  p.separator('-');

  p.text(`Subtotal:        $${fmt(data.subtotal)}`);

  if (data.impuestoConsumo && data.impuestoConsumo > 0) {
    p.text(`Imp. Consumo 8%: $${fmt(data.impuestoConsumo)}`);
  }

  if (data.propina && data.propina > 0) {
    p.text(`Propina:         $${fmt(data.propina)}`);
  }

  return p
    .bold(true).size(2, 1).text(`TOTAL:           $${fmt(data.total)}`)
    .size(1, 1).bold(false)
    .align(1)
    .separator('-')
    .text('ADVERTENCIA PROPINA')
    .text('Se sugiere una propina')
    .text('correspondiente al 10% del')
    .text('valor de la cuenta, la cual')
    .text('podra ser aceptada,')
    .text('modificada o rechazada por')
    .text('usted.')
    .text('')
    .text('Mas que un lugar, una experiencia')
    .text('para tus sentidos.')
    .bold(true).text('Gracias por su compra!').bold(false)
    .feed(4)
    .cut()
    .build();
}

export function buildCierreTicket(data, encoding = 'CP437') {
  const fmt = formatCurrency;

  const p = new EscposBuffer(encoding)
    .init()
    .align(1)
    .text('='.repeat(LINE_WIDTH))
    .bold(true).text('CIERRE DE CAJA - CAFE PANDORA').bold(false)
    .text('='.repeat(LINE_WIDTH))
    .align(0)
    .text('')
    .text(`Fecha: ${new Date().toLocaleDateString('es-AR')}`)
    .text(`Hora: ${new Date().toLocaleTimeString('es-AR')}`)
    .text(`Turno: ${data.turno ?? '-'}`)
    .text(`Usuario: ${data.usuario ?? '-'}`)
    .text('')
    .separator('-')
    .text(`  Ventas: $${fmt(data.ventas)}`)
    .text(`  Gastos: $${fmt(data.gastos)}`)
    .text(`  Diferencia: $${fmt(data.diferencia)}`)
    .separator('-');

  if (data.observaciones) p.text(`Obs: ${data.observaciones}`);

  return p
    .align(1)
    .text('='.repeat(LINE_WIDTH))
    .feed(5)
    .cut()
    .build();
}

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

export function iebNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  let text = String(value ?? '').trim().replace(/[$%\s]/g, '');
  if (!text || text === '-') return null;
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function parseIebRows(rows, fileName) {
  const totalRow = rows.find(row => normalize(row[0]) === 'patrimonio total');
  const total = iebNumber(totalRow?.[1]);
  if (!(total > 0)) throw new Error('No se encontró un patrimonio total válido.');
  const dateValue = rows.find(row => normalize(row[0]).startsWith('fecha'))?.[1];
  const date = typeof dateValue === 'number'
    ? new Date(Date.UTC(1899, 11, 30) + Math.floor(dateValue) * 86400000).toISOString().slice(0, 10)
    : String(dateValue ?? '');
  let columns;
  let section = '';
  const items = [];
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const first = String(row[0] ?? '').trim();
    if (normalize(first) === 'especie') {
      columns = Object.fromEntries(row.map((value, i) => [normalize(value), i]));
      for (const label of ['especie', 'posicion total', '% del total']) {
        if (columns[label] === undefined) throw new Error('Falta la columna ' + label);
      }
      continue;
    }
    if (!first.includes(' - ')) {
      if (first && row.slice(1).every(value => value == null || value === '')) section = first;
      continue;
    }
    if (!columns) continue;
    const rawSymbol = first.split(' - ')[0].trim().toUpperCase();
    const amount = iebNumber(row[columns['posicion total']]);
    const reportedPercentage = iebNumber(row[columns['% del total']]);
    const percentage = reportedPercentage ?? (amount == null ? null : amount / total * 100);
    items.push({
      key: index + 1, rawSymbol, symbol: rawSymbol === 'BRKB' ? 'BRK-B' : rawSymbol,
      name: first, section, amount, percentage, calculated: reportedPercentage == null,
      currency: row[columns['moneda de emision']] ?? '',
      quantity: iebNumber(row[columns.cantidad]), ppp: iebNumber(row[columns.ppp]),
      cash: /dolar|pesos|moneda/i.test(section) || rawSymbol === 'DOLARUSA',
    });
  }
  if (!items.length) throw new Error('No se encontraron instrumentos en la hoja Patrimonio.');
  const currency = /-(ARS|USD)(?:\.[^.]+)?$/i.exec(fileName)?.[1].toUpperCase() || 'Moneda del reporte';
  return { fileName, total, date, items, currency };
}

export function tradeVersion(trades) {
  return trades.map(trade => ({
    id: Number(trade.id), symbol: trade.symbol,
    percentage: trade.portfolio_percentage == null ? null : Number(trade.portfolio_percentage),
    updatedAt: trade.updatedAt,
  })).sort((a, b) => a.id - b.id);
}

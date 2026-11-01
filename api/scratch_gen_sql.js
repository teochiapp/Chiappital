const fs = require('fs');
const content = fs.readFileSync('tickersGlobals.md', 'utf-8');
const lines = content.split('\n');
const items = [];

for (const line of lines) {
  const match = line.match(/^([A-Z0-9]+)(\.U)?\s+-\s+(.+)$/i);
  if (match) {
    const symbol = match[1].toUpperCase();
    const name = match[3].trim().slice(0, 100).replace(/'/g, "''");
    items.push(`('${symbol}', '${name}', 2)`);
  }
}

if (items.length > 0) {
  const sql = 'INSERT IGNORE INTO tracked_symbols (symbol, name, priority) VALUES \n' + items.join(',\n') + ';';
  fs.writeFileSync('insert_tickers.sql', sql);
  console.log('Generated insert_tickers.sql with ' + items.length + ' rows.');
}

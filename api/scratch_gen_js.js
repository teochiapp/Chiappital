const fs = require('fs');
const content = fs.readFileSync('api/tickersGlobals.md', 'utf-8');
const lines = content.split('\n');
let type = 'ETF';
let macro = 'Temáticos'; 
let results = [];
results.push('      // --- Nuevos Tickers (desde tickersGlobals.md) ---');
for (let line of lines) {
  if (line.startsWith('## Empresas Individuales')) {
    type = 'Equity';
    macro = 'Empresas';
  }
  const match = line.match(/^([A-Z0-9]+)(\.U)?\s+-\s+(.+)$/i);
  if (match) {
    const symbol = match[1].toUpperCase() + (match[2] ? match[2].toUpperCase() : '');
    let name = match[3].trim().replace(/'/g, "\'");
    if (type === 'ETF') {
      results.push(`      { symbol: '${symbol}', name: '${name}', sector: 'ETF', macroCategory: 'Temáticos', region: 'US', currency: 'USD', type: 'ETF' },`);
    } else {
      results.push(`      { symbol: '${symbol}', name: '${name}', sector: 'General', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' },`);
    }
  }
}
fs.writeFileSync('api/scratch_gen_js.txt', results.join('\n'));
console.log('Done');

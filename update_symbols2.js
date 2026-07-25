const fs = require('fs');

const cedearsData = new Map();
const lines = fs.readFileSync('cedears_raw.txt', 'utf8').split('\n');
for (const line of lines) {
  let cleanLine = line.trim();
  if (cleanLine.startsWith('+ARG')) cleanLine = cleanLine.substring(1);
  if (!cleanLine.startsWith('ARG')) continue;
  
  const cols = cleanLine.split('\t');
  if (cols.length < 9) continue;
  
  const symbol = cols[1].trim();
  let name = cols[2].trim();
  let volumeStr = cols[8].trim().replace(',', '.');
  let volumeMillions = 0;
  
  if (volumeStr.endsWith('MM')) {
    volumeMillions = parseFloat(volumeStr.replace(' MM', '')) * 1000;
  } else if (volumeStr.endsWith('M')) {
    volumeMillions = parseFloat(volumeStr.replace(' M', ''));
  } else if (volumeStr.endsWith('K')) {
    volumeMillions = parseFloat(volumeStr.replace(' K', '')) / 1000;
  } else if (volumeStr !== '-' && volumeStr !== '') {
    volumeMillions = parseFloat(volumeStr) / 1000000;
  }
  
  if (symbol.length > 0 && !symbol.endsWith('C') && !symbol.endsWith('D')) {
      if (!cedearsData.has(symbol) || volumeMillions > cedearsData.get(symbol).volume) {
          cedearsData.set(symbol, { name, volume: volumeMillions });
      }
  }
}

const content = fs.readFileSync('src/services/symbolSearchService.js', 'utf8');

// The objects are grouped in two arrays: `const popular = [ ... ];` and `const extras = [ ... ];`
// Let's just find and replace the arrays.
// A simpler way: we just recreate the entire `getMockScreenerData` array and return it.

const objRegex = /\{[^}]+\}/g;
const objs = content.match(objRegex) || [];
console.log('Total objects found in file:', objs.length);

let kept = [];
let removed = [];
let existingSymbols = new Set();

for (const objStr of objs) {
  const symMatch = objStr.match(/symbol:\s*'([^']+)'/);
  if (!symMatch) continue;
  const sym = symMatch[1];
  
  // Is it Equity?
  const isEquity = objStr.includes("type: 'Equity'");
  
  if (!isEquity || cedearsData.has(sym)) {
    kept.push(objStr.replace(/\n/g, '').replace(/\s+/g, ' '));
    existingSymbols.add(sym);
  } else {
    removed.push(sym);
  }
}

let added = [];
for (const [sym, data] of cedearsData.entries()) {
  if (!existingSymbols.has(sym) && data.volume > 1.0) {
    let safeName = data.name.replace(/'/g, "\\'");
    added.push(`{ symbol: '${sym}', name: '${safeName}', sector: 'General', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' }`);
  }
}

console.log('Kept:', kept.length);
console.log('Removed:', removed.length, removed.slice(0, 10).join(', '));
console.log('Added:', added.length, added.slice(0, 2).join('\n'));

fs.writeFileSync('new_symbols.json', JSON.stringify({ kept, added }, null, 2));

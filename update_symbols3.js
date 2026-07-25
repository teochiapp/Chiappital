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
  
  if (symbol.length > 0) {
      if (!cedearsData.has(symbol) || volumeMillions > cedearsData.get(symbol).volume) {
          cedearsData.set(symbol, { name, volume: volumeMillions });
      }
  }
}

const content = fs.readFileSync('src/services/symbolSearchService.js', 'utf8');

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
  
  const isEquity = objStr.includes("type: 'Equity'");
  
  const existsInCedears = cedearsData.has(sym) || 
                          cedearsData.has(sym + 'C') || 
                          cedearsData.has(sym + 'D') || 
                          cedearsData.has(sym + '.C') ||
                          cedearsData.has(sym + 'BA'); // some suffixes
  
  if (!isEquity || existsInCedears) {
    kept.push(objStr.replace(/\n/g, '').replace(/\s+/g, ' '));
    existingSymbols.add(sym);
  } else {
    removed.push(sym);
  }
}

let added = [];
for (const [sym, data] of cedearsData.entries()) {
  // If it's a 'C' or 'D' ticker and we already have the base, skip
  let baseSym = sym;
  if (sym.endsWith('C')) baseSym = sym.slice(0, -1);
  else if (sym.endsWith('D')) baseSym = sym.slice(0, -1);
  
  if (existingSymbols.has(baseSym) || existingSymbols.has(sym)) {
      continue;
  }
  
  if (data.volume > 1.0) {
    // Only add if it's the base symbol. If it's a 'C' symbol but volume > 1, we add the base symbol.
    // E.g. AMDC -> we add AMD.
    if (!existingSymbols.has(baseSym)) {
      let safeName = data.name.replace(/'/g, "\\'");
      added.push(`    { symbol: '${baseSym}', name: '${safeName}', sector: 'General', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' }`);
      existingSymbols.add(baseSym);
    }
  }
}

console.log('Kept:', kept.length);
console.log('Removed:', removed.length, removed.slice(0, 10).join(', '));
console.log('Added:', added.length, added.slice(0, 2).join('\n'));

// Now replace the original arrays.
// The file has:
// const popular = [ ... ];
// const extras = [ ... ];
// We can just find the entire function body and replace it.
const regex = /getMockScreenerData\(\)\s*\{([\s\S]*?)\}/;
const newFunctionBody = `
    const popular = [
${kept.join(',\n')}
    ];
    const extras = [
${added.join(',\n')}
    ];
    // Eliminar duplicados por símbolo
    const seen = new Set(popular.map(s => s.symbol));
    const unique = extras.filter(s => !seen.has(s.symbol));
    return [...popular, ...unique];
  `;

const newContent = content.replace(regex, `getMockScreenerData() {${newFunctionBody}}`);

fs.writeFileSync('src/services/symbolSearchService.js', newContent);
console.log('Updated symbolSearchService.js');

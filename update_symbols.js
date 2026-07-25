const fs = require('fs');
const raw = fs.readFileSync('cedears_raw.txt', 'utf8');
const lines = raw.split('\n');

const cedearsData = new Map();

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

console.log('Total unique base CEDEARs:', cedearsData.size);

const servicePath = 'src/services/symbolSearchService.js';
let serviceContent = fs.readFileSync(servicePath, 'utf8');

const regex = /return\s+\[([\s\S]*?)\];/;
const match = serviceContent.match(regex);
if (!match) {
  console.log('Could not find return array in symbolSearchService.js');
  process.exit(1);
}

const arrayStr = match[1];

const objRegex = /\{[^}]+\}/g;
const objs = arrayStr.match(objRegex) || [];

let kept = [];
let removed = [];
let existingSymbols = new Set();

for (const objStr of objs) {
  const symMatch = objStr.match(/symbol:\s*'([^']+)'/);
  if (!symMatch) continue;
  const sym = symMatch[1];
  
  if (cedearsData.has(sym)) {
    kept.push(objStr);
    existingSymbols.add(sym);
  } else {
    removed.push(sym);
  }
}

let added = [];
for (const [sym, data] of cedearsData.entries()) {
  if (!existingSymbols.has(sym) && data.volume > 1.0) {
    let safeName = data.name.replace(/'/g, "\\'");
    added.push(`      { symbol: '${sym}', name: '${safeName}', sector: 'General', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' }`);
  }
}

console.log('Kept:', kept.length);
console.log('Removed:', removed.length, removed.slice(0, 10).join(', '));
console.log('Added:', added.length);

const newArrayStr = '\n' + kept.join(',\n') + (kept.length > 0 && added.length > 0 ? ',\n' : '') + added.join(',\n') + '\n    ';
const newServiceContent = serviceContent.replace(regex, `return [${newArrayStr}];`);

fs.writeFileSync('src/services/symbolSearchService.js', newServiceContent);
console.log('Updated symbolSearchService.js');

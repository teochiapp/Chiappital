const fs = require('fs');
const path = require('path');
const { getPool, initializeDatabase } = require('../database/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedSymbols() {
  console.log('🔄 Initializing database...');
  await initializeDatabase();
  const db = getPool();

  console.log('📖 Leyendo symbolSearchService.js...');
  const content = fs.readFileSync(path.join(__dirname, '../../src/services/symbolSearchService.js'), 'utf8');
  
  const allCedearsMatch = content.match(/getAllCedears\(\) \{\s*return \[(.*?)\];\s*\}/s);
  const popularMatch = content.match(/getPopularSymbols\(\) \{\s*return \[(.*?)\];\s*\}/s);
  
  if (!allCedearsMatch || !popularMatch) {
    console.error('❌ No se encontró la lista de CEDEARs o PopularSymbols.');
    process.exit(1);
  }

  // Truco sucio pero efectivo: evaluar el contenido del array como JS válido para tener los objetos
  let symbols = [];
  try {
    const arr1 = eval(`[${allCedearsMatch[1]}]`);
    const arr2 = eval(`[${popularMatch[1]}]`);
    symbols = [...arr1, ...arr2];
  } catch (e) {
    console.error('❌ Error parseando los símbolos:', e);
    process.exit(1);
  }

  // Añadir también los extras que estaban harcodeados (FSLR, RGTI) y SPY, QQQ, etc.
  const extras = [
    { symbol: 'FSLR', name: 'First Solar Inc.', sector: 'Energía', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' },
    { symbol: 'RGTI', name: 'Rigetti Computing Inc.', sector: 'Software', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'Equity' },
    // Popular indices/ETFs (en caso de que no estén)
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETF', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'ETF' },
    { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average ETF Trust', sector: 'ETF', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'ETF' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'ETF', macroCategory: 'Empresas', region: 'US', currency: 'USD', type: 'ETF' }
  ];

  symbols = [...symbols, ...extras];

  // Dedup por symbol
  const uniqueMap = new Map();
  symbols.forEach(s => uniqueMap.set(s.symbol.toUpperCase(), s));
  const uniqueSymbols = Array.from(uniqueMap.values());

  console.log(`🚀 Se encontraron ${uniqueSymbols.length} símbolos únicos para insertar.`);

  let inserted = 0;
  for (const sym of uniqueSymbols) {
    const exchange = sym.region === 'US' ? 'US' : 'BA'; // Simplificación
    const priority = (['SPY', 'QQQ', 'AAPL', 'MSFT', 'AMZN', 'NVDA', 'META', 'GOOGL', 'TSLA'].includes(sym.symbol)) ? 1 : 2;

    await db.execute(
      `REPLACE INTO tracked_symbols (symbol, name, exchange, market, enabled, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sym.symbol.toUpperCase(), sym.name, exchange, 'Equity', 1, priority]
    );
    inserted++;
  }

  console.log(`✅ ¡Se insertaron/actualizaron ${inserted} símbolos en la base de datos!`);
  process.exit(0);
}

seedSymbols().catch(err => {
  console.error('Error in seed:', err);
  process.exit(1);
});

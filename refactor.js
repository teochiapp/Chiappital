
const fs = require('fs');
const path = 'c:/Users/teoch/OneDrive/Desktop/React/Chiappital/Chiappital/src/services/symbolSearchService.js';
let content = fs.readFileSync(path, 'utf8');

const startStr = 'if (!data.result) return [';
const endStr = '];\n    \n    // Filtrar solo NYSE (US) y BYMA (Argentina)';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const arrayContent = content.substring(startIdx + startStr.length - 1, endIdx + 1);
  
  const newMethod = '\n  getAllCedears() {\n    return ' + arrayContent + ';\n  }\n';
  
  content = content.replace('  getPopularSymbols() {', newMethod + '\n  getPopularSymbols() {');
  
  const oldSearchSymbols = /async searchSymbols\\(query\\) \\{[\\s\\S]*?catch \\(error\\) \\{[\\s\\S]*?\\}\\s*\\}/;
  
  const newSearchSymbols = \sync searchSymbols(query) {
    if (!query || query.length < 2) {
      return this.getPopularSymbols();
    }

    try {
      const cacheKey = query.toLowerCase();
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.results;
      }

      console.log('?? Buscando símbolos localmente para: ' + query);
      
      const allSymbols = [...this.getPopularSymbols(), ...this.getAllCedears()];
      
      const uniqueSymbols = Array.from(new Map(allSymbols.map(item => [item.symbol, item])).values());
      
      const queryLower = query.toLowerCase();
      
      const results = uniqueSymbols.filter(symbol => 
        symbol.symbol.toLowerCase().includes(queryLower) ||
        symbol.name.toLowerCase().includes(queryLower) ||
        (symbol.sector && symbol.sector.toLowerCase().includes(queryLower))
      ).slice(0, 10);
      
      this.cache.set(cacheKey, {
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Error buscando', error);
      return [];
    }
  }\;

  content = content.replace(oldSearchSymbols, newSearchSymbols);
  
  fs.writeFileSync(path, content);
  console.log('Successfully refactored symbolSearchService.js');
} else {
  console.log('Could not find the array bounds');
}


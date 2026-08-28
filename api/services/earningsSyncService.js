const { getPool } = require('../database/db');
const logger = require('../utils/logger');
require('dotenv').config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function fetchEarningsCalendar(fromDate, toDate) {
  const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.earningsCalendar) ? data.earningsCalendar : [];
}

async function runEarningsSync() {
  const db = getPool();
  try {
    const [rows] = await db.query('SELECT symbol FROM tracked_symbols WHERE enabled = 1');
    const trackedSet = new Set(rows.map(r => r.symbol));

    const today = new Date();
    const toDate = new Date(today);
    toDate.setDate(toDate.getDate() + 10);
    const pad = n => n.toString().padStart(2, '0');
    const fmt = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    logger.info('EarningsSync', `Fetching earnings calendar ${fmt(today)} to ${fmt(toDate)}`);
    const calendar = await fetchEarningsCalendar(fmt(today), fmt(toDate));

    // Nos quedamos con la fecha MÁS PRÓXIMA por símbolo (por si el calendario 
    // trae duplicados o correcciones de fecha estimada).
    const earliestBySymbol = new Map();
    for (const item of calendar) {
      if (!item.symbol || !trackedSet.has(item.symbol) || !item.date) continue;
      const existing = earliestBySymbol.get(item.symbol);
      if (!existing || item.date < existing) {
        earliestBySymbol.set(item.symbol, item.date);
      }
    }

    let updated = 0;
    for (const [symbol, earningsDate] of earliestBySymbol.entries()) {
      await db.execute(
        'UPDATE tracked_symbols SET next_earnings_date = ?, earnings_updated_at = NOW() WHERE symbol = ?',
        [earningsDate, symbol]
      );
      updated++;
    }

    // Limpiar símbolos que ya no aparecen en la ventana (reportaron y pasaron, 
    // o se corrigió la fecha fuera del rango consultado)
    const symbolsWithDate = Array.from(earliestBySymbol.keys());
    if (symbolsWithDate.length > 0) {
      await db.query(
        `UPDATE tracked_symbols SET next_earnings_date = NULL 
         WHERE enabled = 1 AND next_earnings_date < CURDATE() 
         AND symbol NOT IN (?)`,
        [symbolsWithDate]
      );
    }

    logger.info('EarningsSync', `Updated ${updated} symbols with upcoming earnings dates`);
  } catch (error) {
    logger.error('EarningsSync', `Error: ${error.message}`);
  }
}

module.exports = { runEarningsSync };

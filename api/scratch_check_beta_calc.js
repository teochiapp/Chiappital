const mysql = require('mysql2/promise');

async function checkBetaCalc() {
  const connection = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });

  try {
    const [trades] = await connection.execute(`
      SELECT symbol, portfolio_percentage FROM trades 
      WHERE user_id = 1 AND status = 'open' AND account_type = 'propia'
    `);
    
    // Simulate what the frontend does.
    // We don't have the live beta from Finnhub here, so let's assume default beta = 1.0 
    // unless it's a known inverse ETF.
    // But since the user gets 0.91, it means the betas must be averaging out to ~0.91!
    // But wait, what if the sum of portfolio_percentage is WRONG?
    
    let rawTotalPct = 0;
    
    console.log('--- Trades ---');
    trades.forEach(t => {
      const pct = parseFloat(t.portfolio_percentage) || 0;
      rawTotalPct += pct;
      console.log(`Symbol: ${t.symbol}, Pct: ${pct}%`);
    });

    const cashPct = Math.max(0, 100 - rawTotalPct);
    console.log(`\\nTotal Invested Pct: ${rawTotalPct}%`);
    console.log(`Cash Pct: ${cashPct}%`);
    
    // Let's assume all stocks have beta=1.0 for simplicity, and TQQQ has beta=3.0.
    // If the invested % is ~44%, and cash is 56%, 
    // and average beta of stocks is 1.5,
    // (44 * 1.5) / 100 = 0.66.
    
    // But what if the user's portfolio_percentages don't represent the true current percentage?
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkBetaCalc();

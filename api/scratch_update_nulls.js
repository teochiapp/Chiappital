const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });
  
  const [result] = await conn.execute(`
    UPDATE tracked_symbols 
    SET exchange = 'US', market = 'Equity', index_symbol = 'SPY' 
    WHERE exchange IS NULL OR market IS NULL
  `);
  
  console.log('Updated rows:', result.affectedRows);
  await conn.end();
}
run().catch(console.error);

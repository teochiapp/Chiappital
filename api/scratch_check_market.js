const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });
  const [rows] = await conn.execute("SELECT symbol, exchange, market, index_symbol FROM tracked_symbols WHERE symbol IN ('SPY', 'QQQ', 'DIA')");
  console.log(rows);
  await conn.end();
}
run().catch(console.error);

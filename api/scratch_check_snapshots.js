const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });
  const [rows] = await conn.execute("SHOW TRIGGERS LIKE 'tracked_symbols'");
  console.log('Triggers:', rows);
  
  const [snap] = await conn.execute('SELECT COUNT(*) as c FROM market_snapshot');
  console.log('Snapshots count:', snap[0].c);

  const [nullDates] = await conn.execute('SELECT COUNT(*) as c FROM market_snapshot WHERE updated_at IS NULL');
  console.log('Snapshots with NULL updated_at:', nullDates[0].c);
  
  const [recentDates] = await conn.execute('SELECT COUNT(*) as c FROM market_snapshot WHERE updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)');
  console.log('Snapshots updated recently:', recentDates[0].c);
  
  await conn.end();
}
run().catch(console.error);

const mysql = require('mysql2/promise');

async function testDb() {
  const connection = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });

  try {
    // Insert a high snapshot for user 1, propia
    await connection.execute(`
      INSERT INTO portfolio_snapshots (user_id, account_type, total_usd, snapshot_date)
      VALUES (1, 'propia', 30000.00, '2026-09-01')
    `);
    console.log('Inserted test snapshot');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

testDb();

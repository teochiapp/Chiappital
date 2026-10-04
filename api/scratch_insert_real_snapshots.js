const mysql = require('mysql2/promise');

async function setRealSnapshots() {
  const connection = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });

  try {
    // 1. Delete old test snapshots for user 1 to ensure a clean slate
    await connection.execute(`
      DELETE FROM portfolio_snapshots 
      WHERE user_id = 1
    `);
    console.log('✅ Deleted old test snapshots.');

    // 2. Insert the real ATH for 'propia' (24406)
    await connection.execute(`
      INSERT INTO portfolio_snapshots (user_id, account_type, total_usd, snapshot_date)
      VALUES (1, 'propia', 24406.00, '2026-09-01')
    `);
    console.log('✅ Inserted ATH for cuenta propia: $24,406');

    // 3. Insert the real ATH for 'compartida' (8397)
    await connection.execute(`
      INSERT INTO portfolio_snapshots (user_id, account_type, total_usd, snapshot_date)
      VALUES (1, 'compartida', 8397.00, '2026-09-01')
    `);
    console.log('✅ Inserted ATH for cuenta compartida: $8,397');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

setRealSnapshots();

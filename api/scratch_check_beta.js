const mysql = require('mysql2/promise');

async function checkBeta() {
  const connection = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });

  try {
    const [trades] = await connection.execute(`
      SELECT * FROM trades 
      WHERE user_id = 1 AND status = 'open'
    `);
    console.log('--- Open Trades ---');
    console.log(trades);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkBeta();

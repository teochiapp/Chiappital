const mysql = require('mysql2/promise');

async function checkDb() {
  const connection = await mysql.createConnection({
    host: 'srv812.hstgr.io',
    user: 'u639575812_admin',
    password: 'D3hm3Pa;',
    database: 'u639575812_trades_data',
    port: 3306
  });

  try {
    const [balances] = await connection.execute('SELECT * FROM portfolio_balances');
    console.log('--- Portfolio Balances ---');
    console.log(balances);

    const [snapshots] = await connection.execute('SELECT * FROM portfolio_snapshots');
    console.log('\n--- Portfolio Snapshots ---');
    console.log(snapshots);
    
    // Also check the structure of portfolio_snapshots
    const [columns] = await connection.execute('SHOW COLUMNS FROM portfolio_snapshots');
    console.log('\n--- portfolio_snapshots Schema ---');
    console.log(columns);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkDb();

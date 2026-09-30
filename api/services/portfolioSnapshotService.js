const { getPool } = require('../database/db');
const logger = require('../utils/logger');

/**
 * Guarda un snapshot del capital total actual para todos los usuarios y tipos de cuenta.
 * Esto debe llamarse a medianoche para registrar el capital diario.
 */
async function takeDailySnapshots() {
  const db = getPool();
  try {
    logger.info('PortfolioSnapshot', 'Iniciando guardado de snapshots diarios de capital...');
    
    // Obtener los balances actuales
    const [balances] = await db.execute(`
      SELECT user_id, account_type, total_usd 
      FROM portfolio_balances
    `);

    if (!balances || balances.length === 0) {
      logger.info('PortfolioSnapshot', 'No hay balances para guardar.');
      return;
    }

    // Insertar/Actualizar el snapshot del día
    // Usamos el snapshot_date basado en el momento actual
    const today = new Date().toISOString().split('T')[0];

    let count = 0;
    for (const balance of balances) {
      await db.execute(`
        INSERT INTO portfolio_snapshots (user_id, account_type, total_usd, snapshot_date)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE total_usd = VALUES(total_usd)
      `, [balance.user_id, balance.account_type, balance.total_usd, today]);
      count++;
    }

    logger.info('PortfolioSnapshot', `✅ ${count} snapshots diarios guardados exitosamente.`);
  } catch (error) {
    logger.error('PortfolioSnapshot', \`Error al guardar snapshots diarios: \${error.message}\`);
  }
}

module.exports = {
  takeDailySnapshots
};

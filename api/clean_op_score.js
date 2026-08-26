require('dotenv').config();
const { getPool } = require('./database/db');

async function cleanOpScore() {
  const db = getPool();

  try {
    const [result] = await db.execute(
      'UPDATE market_data SET op_score = NULL, op_score_conclusions = NULL'
    );
    console.log(`Successfully cleaned OP Score for ${result.affectedRows} rows.`);
  } catch (error) {
    console.error('Error cleaning OP Score:', error);
  } finally {
    process.exit(0);
  }
}

cleanOpScore();

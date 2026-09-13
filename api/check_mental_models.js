require('dotenv').config();
const { initializeDatabase, getPool } = require('./database/db');

async function run() {
  await initializeDatabase();
  const db = getPool();
  const [rows] = await db.execute('SELECT id, concept_name, repetition, interval_days, ease_factor FROM mental_models');
  console.log(rows);
  process.exit(0);
}

run();

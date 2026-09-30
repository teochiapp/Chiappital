require('dotenv').config({ path: './.env' });
const { getPool } = require('./database/db');

async function deleteRecipes() {
  const db = getPool();
  try {
    const [result1] = await db.execute('DELETE FROM med_recipes WHERE name LIKE "%Aderezo%"');
    console.log(`Borrados ${result1.affectedRows} aderezos.`);

    const [result2] = await db.execute('DELETE FROM med_recipes WHERE name LIKE "%Improvisada%"');
    console.log(`Borradas ${result2.affectedRows} ensaladas improvisadas.`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

deleteRecipes();

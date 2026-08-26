const mysql = require('mysql2/promise');
require('dotenv').config();

async function testUpdate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const userId = 1; 
    
    // insert a dummy recipe
    const [ins] = await pool.execute(
      `INSERT INTO med_recipes (user_id, name) VALUES (?, ?)`,
      [userId, 'Test Recipe']
    );
    const id = ins.insertId;
    console.log('Inserted id:', id);

    // try update
    const [result] = await pool.execute(
      `UPDATE med_recipes SET
        name = COALESCE(?, name),
        ingredients = COALESCE(?, ingredients),
        is_favorite = COALESCE(?, is_favorite)
       WHERE id = ? AND user_id = ?`,
      [
        'Updated Name',
        JSON.stringify([{qty: 1, name: 'Test'}]),
        null, // testing undefined behavior
        id, 
        userId
      ]
    );
    console.log('Update result:', result);
  } catch (error) {
    console.error('Error updating:', error);
  } finally {
    await pool.end();
  }
}

testUpdate();

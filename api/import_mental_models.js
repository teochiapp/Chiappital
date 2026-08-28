const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getPool, initializeDatabase } = require('./database/db');

async function importData() {
  try {
    await initializeDatabase();
    
    const jsonPath = path.join(__dirname, '../mental_models-2.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const db = getPool();
    // Assuming user_id = 1 for the main user (Teo)
    const userId = 1; 

    let insertedCount = 0;

    for (const book of data) {
      for (const concept of book.concepts) {
        // Formatear la fecha actual a UTC-3 como string YYYY-MM-DD
        const date = new Date();
        const todayStr = date.toISOString().split('T')[0];
        
        await db.execute(
          'INSERT INTO mental_models (user_id, concept_name, content, book_title, author, category, next_review) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            userId, 
            concept.concept_name, 
            concept.content, 
            book.book_title, 
            book.author || null, 
            book.category || null, 
            todayStr
          ]
        );
        insertedCount++;
      }
    }

    console.log(`✅ Importados ${insertedCount} conceptos correctamente.`);
    process.exit(0);
  } catch (error) {
    console.error('Error importando datos:', error);
    process.exit(1);
  }
}

importData();

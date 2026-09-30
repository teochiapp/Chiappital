require('dotenv').config({ path: '../.env' });
const { getPool } = require('../database/db');
const fs = require('fs');
const path = require('path');

async function seedSalads() {
  const db = getPool();
  try {
    // Buscar al menos un usuario para asociarle las recetas
    const [users] = await db.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos. Debes crear uno primero.');
      process.exit(1);
    }
    const userId = users[0].id;
    console.log(`Usando el usuario con ID: ${userId} para subir las recetas.`);

    const dataPath = path.join(__dirname, 'seedData.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const salads = JSON.parse(rawData);

    for (const salad of salads) {
      const query = `
        INSERT INTO med_recipes (
          user_id, name, category, prep_time, cook_time, difficulty, cost,
          ingredients, steps, tags, health_tags, learning
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        userId,
        salad.name,
        salad.category,
        salad.prep_time,
        salad.cook_time,
        salad.difficulty,
        salad.cost,
        salad.ingredients,
        salad.steps,
        salad.tags,
        salad.health_tags,
        salad.learning
      ];
      await db.execute(query, values);
      console.log(`✅ Receta insertada: ${salad.name}`);
    }

    console.log('✨ ¡Todas las ensaladas han sido insertadas exitosamente!');
  } catch (error) {
    console.error('Error al insertar las ensaladas:', error);
  } finally {
    process.exit(0);
  }
}

seedSalads();

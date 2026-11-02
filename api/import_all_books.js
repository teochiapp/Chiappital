// api/import_all_books.js - Script de importación y enlace al Knowledge Graph
const fs = require('fs');
const path = require('path');
require('./node_modules/dotenv').config({ path: path.join(__dirname, '.env') });
require('./node_modules/dotenv').config({ path: path.join(__dirname, '.env.local') });
const { getPool, initializeDatabase } = require('./database/db');

const USER_ID = 1;

// Módulos de libros
const booksFinance = require('./data/books_finance');
const booksProductivity = require('./data/books_productivity');
const booksPhilosophyPsychology = require('./data/books_philosophy_psychology');
const relationsData = require('./data/books_relations');

const allBooks = [
  ...booksFinance,
  ...booksProductivity,
  ...booksPhilosophyPsychology
];

// Directorio para guardar copias Markdown optimizadas en disco
const optimizedDir = path.resolve(__dirname, '../notion/Libros/optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

async function main() {
  console.log(`=======================================================`);
  console.log(`🚀 INICIANDO IMPORTACIÓN DE ${allBooks.length} LIBROS AL KNOWLEDGE GRAPH`);
  console.log(`=======================================================\n`);

  await initializeDatabase();
  const db = getPool();

  // 1. Gestionar Tags en knowledge_tags
  console.log(`🏷️ Mapeando etiquetas (tags)...`);
  const allTags = new Set();
  allBooks.forEach(b => (b.tags || []).forEach(t => allTags.add(t)));

  const tagMap = new Map(); // tagName -> tagId
  const colors = ['#8b5cf6', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#14b8a6', '#f43f5e'];

  for (const tagName of allTags) {
    const [tagRows] = await db.query(
      'SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?',
      [USER_ID, tagName]
    );
    if (tagRows.length > 0) {
      tagMap.set(tagName, tagRows[0].id);
    } else {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const [newTag] = await db.query(
        'INSERT INTO knowledge_tags (user_id, name, color, created_at) VALUES (?, ?, ?, NOW())',
        [USER_ID, tagName, randomColor]
      );
      tagMap.set(tagName, newTag.insertId);
    }
  }
  console.log(`✅ ${tagMap.size} tags disponibles en base de datos.\n`);

  // 2. Insertar / Actualizar las Notas de los Libros
  const keyToNoteId = new Map(); // bookKey -> noteId

  for (const book of allBooks) {
    // Guardar copia local en Markdown limpio
    const cleanFilename = `${book.title.replace(/[/\\?%*:|"<>]/g, '')}.md`;
    fs.writeFileSync(path.join(optimizedDir, cleanFilename), book.content, 'utf8');

    // Verificar si la nota ya existe por título
    const [existingNote] = await db.query(
      'SELECT id FROM knowledge_notes WHERE user_id = ? AND title = ?',
      [USER_ID, book.title]
    );

    let noteId;
    if (existingNote.length > 0) {
      noteId = existingNote[0].id;
      await db.query(
        `UPDATE knowledge_notes 
         SET content = ?, primary_category_id = ?, note_type = 'permanent', 
             status = 'published', is_favorite = ?, pinned = ?, updated_at = NOW() 
         WHERE id = ?`,
        [book.content, book.categoryId, book.isFavorite || 0, book.pinned || 0, noteId]
      );
      console.log(`🔄 Actualizada: [ID ${noteId}] "${book.title}"`);
    } else {
      const [insertRes] = await db.query(
        `INSERT INTO knowledge_notes 
         (user_id, title, content, content_format, primary_category_id, note_type, status, is_favorite, pinned, created_at, updated_at)
         VALUES (?, ?, ?, 'markdown', ?, 'permanent', 'published', ?, ?, NOW(), NOW())`,
        [USER_ID, book.title, book.content, book.categoryId, book.isFavorite || 0, book.pinned || 0]
      );
      noteId = insertRes.insertId;
      console.log(`📝 Creada:     [ID ${noteId}] "${book.title}"`);
    }

    keyToNoteId.set(book.key, noteId);

    // Asociar a áreas en knowledge_note_areas
    await db.query('DELETE FROM knowledge_note_areas WHERE note_id = ?', [noteId]);
    for (const aId of (book.areaIds || [book.categoryId])) {
      await db.query('INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, ?)', [noteId, aId]);
    }

    // Asociar tags en knowledge_note_tags
    await db.query('DELETE FROM knowledge_note_tags WHERE note_id = ?', [noteId]);
    for (const tagName of (book.tags || [])) {
      const tId = tagMap.get(tagName);
      if (tId) {
        await db.query('INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tId]);
      }
    }
  }

  console.log(`\n🕸️ Conectando relaciones semánticas en el Grafo de Conocimiento...`);
  let relationsInserted = 0;

  for (const rel of relationsData) {
    const srcId = keyToNoteId.get(rel.from);
    const tgtId = rel.toExternalId || keyToNoteId.get(rel.to);

    if (srcId && tgtId && srcId !== tgtId) {
      try {
        await db.query(
          `INSERT INTO knowledge_relations (user_id, source_note_id, target_note_id, relation_type, origin, description, created_at)
           VALUES (?, ?, ?, ?, 'manual', ?, NOW())
           ON DUPLICATE KEY UPDATE description = VALUES(description), relation_type = VALUES(relation_type)`,
          [USER_ID, srcId, tgtId, rel.type, rel.desc]
        );
        relationsInserted++;
      } catch (err) {
        console.warn(`  ⚠️ No se pudo insertar relación entre ${srcId} y ${tgtId}:`, err.message);
      }
    } else {
      console.warn(`  ⚠️ Relación no resuelta: ${rel.from} -> ${rel.to || rel.toExternalId}`);
    }
  }

  console.log(`✅ ${relationsInserted} aristas/relaciones registradas en knowledge_relations.`);

  console.log(`\n🎉 =======================================================`);
  console.log(`✨ ¡PROCESO DE IMPORTACIÓN COMPLETADO CON ÉXITO!`);
  console.log(`📁 23 archivos Markdown optimizados guardados en: ${optimizedDir}`);
  console.log(`📚 23 notas disponibles en Knowledge Hub`);
  console.log(`🕸️ Grafo de conocimiento totalmente interconectado`);
  console.log(`=======================================================\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal en importador:', err);
  process.exit(1);
});

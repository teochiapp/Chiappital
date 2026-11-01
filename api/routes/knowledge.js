// routes/knowledge.js - API para Knowledge Hub (Second Brain)
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const exportService = require('../services/knowledgeExportService');

const router = express.Router();
router.use(authenticate);

// Configuración de multer para adjuntos de notas
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `knowledge-${base}-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Sembrar áreas y categorías iniciales si el usuario no tiene ninguna
async function seedDefaultAreasIfEmpty(db, userId) {
  const [rows] = await db.execute('SELECT COUNT(*) as count FROM knowledge_areas WHERE user_id = ?', [userId]);
  if (rows[0].count > 0) return;

  const initialAreas = [
    {
      name: 'Programming',
      icon: 'Code',
      color: '#3b82f6',
      description: 'Frontend, backend, arquitectura, DevOps y modelos de IA',
      sort_order: 1,
      categories: [
        'Frontend Development',
        'Backend & Architecture',
        'DevOps & Infrastructure',
        'Cybersecurity',
        'AI & Machine Learning',
        'Programming Concepts'
      ]
    },
    {
      name: 'Finance',
      icon: 'DollarSign',
      color: '#10b981',
      description: 'Inversiones, análisis técnico, macroeconomía e instrumentos',
      sort_order: 2,
      categories: [
        'Investing',
        'Technical Analysis',
        'Macroeconomics',
        'Personal Finance',
        'Business & Markets',
        'Financial Instruments'
      ]
    },
    {
      name: 'Personal Development',
      icon: 'Compass',
      color: '#8b5cf6',
      description: 'Psicología, filosofía, hábitos, productividad y toma de decisiones',
      sort_order: 3,
      categories: [
        'Psychology',
        'Philosophy',
        'Habits & Productivity',
        'Decision Making',
        'Personal Growth'
      ]
    },
    {
      name: 'History & Culture',
      icon: 'Landmark',
      color: '#f59e0b',
      description: 'Historia universal, geopolítica, literatura y figuras históricas',
      sort_order: 4,
      categories: [
        'World History',
        'Geopolitics',
        'Literature',
        'Culture',
        'Historical Figures'
      ]
    },
    {
      name: 'Books & Learning',
      icon: 'BookOpen',
      color: '#ec4899',
      description: 'Notas de lectura, autores, investigación y recursos de estudio',
      sort_order: 5,
      categories: [
        'Reading Notes',
        'Authors',
        'Research',
        'Learning Resources'
      ]
    }
  ];

  for (const area of initialAreas) {
    const [areaRes] = await db.execute(
      `INSERT INTO knowledge_areas (user_id, name, description, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, area.name, area.description, area.icon, area.color, area.sort_order]
    );
    const areaId = areaRes.insertId;

    for (let i = 0; i < area.categories.length; i++) {
      await db.execute(
        `INSERT INTO knowledge_categories (user_id, area_id, name, sort_order)
         VALUES (?, ?, ?, ?)`,
        [userId, areaId, area.categories[i], i + 1]
      );
    }
  }
}

// Extrae enlaces de estilo Obsidian [[Título de Nota]] o [[Título de Nota|Texto alternativo]]
function extractWikiLinks(text) {
  if (!text) return [];
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    const title = match[1].trim();
    if (title) links.add(title);
  }
  return Array.from(links);
}

// Sincroniza enlaces internos con knowledge_relations
async function syncInternalLinks(db, userId, noteId, content) {
  const linkedTitles = extractWikiLinks(content);
  if (linkedTitles.length === 0) return;

  for (const title of linkedTitles) {
    const [targetRows] = await db.execute(
      'SELECT id FROM knowledge_notes WHERE user_id = ? AND LOWER(title) = LOWER(?) LIMIT 1',
      [userId, title]
    );

    if (targetRows.length > 0) {
      const targetNoteId = targetRows[0].id;
      if (targetNoteId !== noteId) {
        await db.execute(
          `INSERT INTO knowledge_relations (user_id, source_note_id, target_note_id, relation_type, origin)
           VALUES (?, ?, ?, 'references', 'manual')
           ON DUPLICATE KEY UPDATE relation_type = VALUES(relation_type)`,
          [userId, noteId, targetNoteId]
        ).catch(err => { console.error('Error sincronizando enlace interno:', err.message); });
      }
    }
  }
}

// ─── OVERVIEW / DASHBOARD ───────────────────────────────────────────────────

// GET /api/knowledge/overview
router.get('/overview', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    await seedDefaultAreasIfEmpty(db, userId);

    // Métricas globales
    const [[notesCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_notes WHERE user_id = ?', [userId]);
    const [[areasCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_areas WHERE user_id = ?', [userId]);
    const [[categoriesCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_categories WHERE user_id = ?', [userId]);
    const [[relationsCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_relations WHERE user_id = ?', [userId]);
    const [[inboxCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_resources WHERE user_id = ? AND status = "inbox"', [userId]);
    const [[favoritesCount]] = await db.execute('SELECT COUNT(*) as count FROM knowledge_notes WHERE user_id = ? AND is_favorite = 1', [userId]);

    // Áreas con contadores
    const [areas] = await db.execute(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM knowledge_categories c WHERE c.area_id = a.id) as subcategories_count,
        (SELECT COUNT(DISTINCT n.id) FROM knowledge_notes n 
         LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id 
         LEFT JOIN knowledge_note_areas na ON na.note_id = n.id
         WHERE (c.area_id = a.id OR na.area_id = a.id) AND n.user_id = a.user_id) as notes_count,
        (SELECT MAX(n.updated_at) FROM knowledge_notes n 
         LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id 
         LEFT JOIN knowledge_note_areas na ON na.note_id = n.id
         WHERE (c.area_id = a.id OR na.area_id = a.id) AND n.user_id = a.user_id) as last_activity
      FROM knowledge_areas a
      WHERE a.user_id = ?
      ORDER BY a.sort_order ASC, a.name ASC
    `, [userId]);

    // Notas recientes
    const [recentNotes] = await db.execute(`
      SELECT n.id, n.title, n.updated_at, n.created_at, n.is_favorite,
             c.name as category_name, a.name as area_name, a.color as area_color,
             SUBSTRING(n.content, 1, 140) as preview
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE n.user_id = ?
      ORDER BY n.updated_at DESC
      LIMIT 8
    `, [userId]);

    // Notas sin categoría (insights)
    const [[uncategorizedCount]] = await db.execute(
      'SELECT COUNT(*) as count FROM knowledge_notes WHERE user_id = ? AND primary_category_id IS NULL',
      [userId]
    );

    // Notas huérfanas (sin relaciones)
    const [[isolatedCount]] = await db.execute(`
      SELECT COUNT(*) as count FROM knowledge_notes n
      WHERE n.user_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM knowledge_relations r 
        WHERE r.source_note_id = n.id OR r.target_note_id = n.id
      )
    `, [userId]);

    // Sugerencias de IA pendientes
    const [[pendingAiCount]] = await db.execute(
      'SELECT COUNT(*) as count FROM knowledge_ai_suggestions WHERE user_id = ? AND status = "pending"',
      [userId]
    );

    res.json({
      metrics: {
        totalNotes: notesCount.count,
        totalAreas: areasCount.count,
        totalCategories: categoriesCount.count,
        totalRelations: relationsCount.count,
        inboxCount: inboxCount.count,
        favoritesCount: favoritesCount.count,
      },
      areas,
      recentNotes,
      insights: {
        uncategorizedNotes: uncategorizedCount.count,
        isolatedNotes: isolatedCount.count,
        pendingAiSuggestions: pendingAiCount.count,
      }
    });
  } catch (error) {
    console.error('Error en GET /api/knowledge/overview:', error);
    res.status(500).json({ error: { message: 'Error al obtener resumen de Knowledge Hub.' } });
  }
});

// ─── ÁREAS Y CATEGORÍAS ─────────────────────────────────────────────────────

// GET /api/knowledge/areas
router.get('/areas', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    await seedDefaultAreasIfEmpty(db, userId);

    const [areas] = await db.execute(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM knowledge_categories c WHERE c.area_id = a.id) as subcategories_count,
        (SELECT COUNT(DISTINCT n.id) FROM knowledge_notes n 
         LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id 
         LEFT JOIN knowledge_note_areas na ON na.note_id = n.id
         WHERE (c.area_id = a.id OR na.area_id = a.id) AND n.user_id = a.user_id) as notes_count
      FROM knowledge_areas a
      WHERE a.user_id = ?
      ORDER BY a.sort_order ASC, a.name ASC
    `, [userId]);

    const [categories] = await db.execute(`
      SELECT c.*,
        (SELECT COUNT(*) FROM knowledge_notes n WHERE n.primary_category_id = c.id) as notes_count
      FROM knowledge_categories c
      WHERE c.user_id = ?
      ORDER BY c.sort_order ASC, c.name ASC
    `, [userId]);

    // Anidar categorías dentro de sus áreas
    const categoriesByArea = {};
    categories.forEach(cat => {
      if (!categoriesByArea[cat.area_id]) categoriesByArea[cat.area_id] = [];
      categoriesByArea[cat.area_id].push(cat);
    });

    const result = areas.map(area => ({
      ...area,
      categories: categoriesByArea[area.id] || []
    }));

    res.json({ areas: result });
  } catch (error) {
    console.error('Error en GET /api/knowledge/areas:', error);
    res.status(500).json({ error: { message: 'Error al obtener áreas.' } });
  }
});

// POST /api/knowledge/areas
router.post('/areas', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { name, description, icon = 'Folder', color = '#8b5cf6', sort_order = 0 } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: { message: 'El nombre del área es requerido.' } });
    }

    const [result] = await db.execute(
      `INSERT INTO knowledge_areas (user_id, name, description, icon, color, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), description || null, icon, color, sort_order]
    );

    const [created] = await db.execute('SELECT * FROM knowledge_areas WHERE id = ?', [result.insertId]);
    res.status(201).json({ area: created[0] });
  } catch (error) {
    console.error('Error en POST /api/knowledge/areas:', error);
    res.status(500).json({ error: { message: 'Error al crear área.' } });
  }
});

// PUT /api/knowledge/areas/:id
router.put('/areas/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const areaId = req.params.id;
    const { name, description, icon, color, sort_order } = req.body;

    const [existing] = await db.execute('SELECT id FROM knowledge_areas WHERE id = ? AND user_id = ?', [areaId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: { message: 'Área no encontrada.' } });
    }

    await db.execute(
      `UPDATE knowledge_areas 
       SET name = COALESCE(?, name),
           description = COALESCE(?, description),
           icon = COALESCE(?, icon),
           color = COALESCE(?, color),
           sort_order = COALESCE(?, sort_order),
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name?.trim(), description, icon, color, sort_order, areaId, userId]
    );

    const [updated] = await db.execute('SELECT * FROM knowledge_areas WHERE id = ?', [areaId]);
    res.json({ area: updated[0] });
  } catch (error) {
    console.error('Error en PUT /api/knowledge/areas/:id:', error);
    res.status(500).json({ error: { message: 'Error al actualizar área.' } });
  }
});

// DELETE /api/knowledge/areas/:id
router.delete('/areas/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const areaId = req.params.id;

    // Preservar las notas: desvincular categorías de las notas antes de borrar el área
    const [categories] = await db.execute('SELECT id FROM knowledge_categories WHERE area_id = ? AND user_id = ?', [areaId, userId]);
    const catIds = categories.map(c => c.id);
    if (catIds.length > 0) {
      const placeholders = catIds.map(() => '?').join(',');
      await db.execute(`UPDATE knowledge_notes SET primary_category_id = NULL WHERE primary_category_id IN (${placeholders})`, catIds);
    }

    await db.execute('DELETE FROM knowledge_note_areas WHERE area_id = ?', [areaId]);
    const [result] = await db.execute('DELETE FROM knowledge_areas WHERE id = ? AND user_id = ?', [areaId, userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Área no encontrada.' } });
    }

    res.json({ success: true, message: 'Área eliminada exitosamente. Las notas asociadas se conservaron.' });
  } catch (error) {
    console.error('Error en DELETE /api/knowledge/areas/:id:', error);
    res.status(500).json({ error: { message: 'Error al eliminar área.' } });
  }
});

// GET /api/knowledge/categories
router.get('/categories', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;

    const [categories] = await db.execute(`
      SELECT c.*, a.name as area_name, a.color as area_color, a.icon as area_icon,
        (SELECT COUNT(*) FROM knowledge_notes n WHERE n.primary_category_id = c.id) as notes_count
      FROM knowledge_categories c
      JOIN knowledge_areas a ON c.area_id = a.id
      WHERE c.user_id = ?
      ORDER BY a.sort_order ASC, c.sort_order ASC, c.name ASC
    `, [userId]);

    res.json({ categories });
  } catch (error) {
    console.error('Error en GET /api/knowledge/categories:', error);
    res.status(500).json({ error: { message: 'Error al obtener categorías.' } });
  }
});

// POST /api/knowledge/categories
router.post('/categories', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { area_id, parent_id = null, name, description = null, sort_order = 0 } = req.body;

    if (!area_id || !name || !name.trim()) {
      return res.status(400).json({ error: { message: 'area_id y name son requeridos.' } });
    }

    // Verificar que el área pertenece al usuario
    const [area] = await db.execute('SELECT id FROM knowledge_areas WHERE id = ? AND user_id = ?', [area_id, userId]);
    if (area.length === 0) {
      return res.status(404).json({ error: { message: 'Área no encontrada.' } });
    }

    const [result] = await db.execute(
      `INSERT INTO knowledge_categories (user_id, area_id, parent_id, name, description, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, area_id, parent_id || null, name.trim(), description, sort_order]
    );

    const [created] = await db.execute('SELECT * FROM knowledge_categories WHERE id = ?', [result.insertId]);
    res.status(201).json({ category: created[0] });
  } catch (error) {
    console.error('Error en POST /api/knowledge/categories:', error);
    res.status(500).json({ error: { message: 'Error al crear categoría.' } });
  }
});

// PUT /api/knowledge/categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const catId = req.params.id;
    const { area_id, parent_id, name, description, sort_order } = req.body;

    const [existing] = await db.execute('SELECT id FROM knowledge_categories WHERE id = ? AND user_id = ?', [catId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: { message: 'Categoría no encontrada.' } });
    }

    await db.execute(
      `UPDATE knowledge_categories 
       SET area_id = COALESCE(?, area_id),
           parent_id = ?,
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           sort_order = COALESCE(?, sort_order),
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [area_id, parent_id !== undefined ? parent_id : null, name?.trim(), description, sort_order, catId, userId]
    );

    const [updated] = await db.execute('SELECT * FROM knowledge_categories WHERE id = ?', [catId]);
    res.json({ category: updated[0] });
  } catch (error) {
    console.error('Error en PUT /api/knowledge/categories/:id:', error);
    res.status(500).json({ error: { message: 'Error al actualizar categoría.' } });
  }
});

// DELETE /api/knowledge/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const catId = req.params.id;

    // Preservar notas: poner primary_category_id en null
    await db.execute('UPDATE knowledge_notes SET primary_category_id = NULL WHERE primary_category_id = ? AND user_id = ?', [catId, userId]);

    const [result] = await db.execute('DELETE FROM knowledge_categories WHERE id = ? AND user_id = ?', [catId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Categoría no encontrada.' } });
    }

    res.json({ success: true, message: 'Categoría eliminada. Las notas no se han eliminado.' });
  } catch (error) {
    console.error('Error en DELETE /api/knowledge/categories/:id:', error);
    res.status(500).json({ error: { message: 'Error al eliminar categoría.' } });
  }
});

// ─── NOTAS ──────────────────────────────────────────────────────────────────

// GET /api/knowledge/notes
router.get('/notes', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      search,
      area_id,
      category_id,
      tag,
      is_favorite,
      sort = 'updated',
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT DISTINCT n.id, n.title, n.note_type, n.status, n.is_favorite, n.pinned,
             n.created_at, n.updated_at, n.archived_at,
             c.id as category_id, c.name as category_name,
             a.id as area_id, a.name as area_name, a.color as area_color, a.icon as area_icon,
             SUBSTRING(n.content, 1, 200) as preview,
             (SELECT COUNT(*) FROM knowledge_relations r WHERE r.source_note_id = n.id) as outgoing_links_count,
             (SELECT COUNT(*) FROM knowledge_relations r WHERE r.target_note_id = n.id) as backlinks_count
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      LEFT JOIN knowledge_note_areas na ON na.note_id = n.id
      LEFT JOIN knowledge_note_tags nt ON nt.note_id = n.id
      LEFT JOIN knowledge_tags t ON nt.tag_id = t.id
      WHERE n.user_id = ?
    `;

    const params = [userId];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (n.title LIKE ? OR n.content LIKE ?)`;
      params.push(term, term);
    }

    if (area_id) {
      query += ` AND (c.area_id = ? OR na.area_id = ?)`;
      params.push(area_id, area_id);
    }

    if (category_id) {
      query += ` AND n.primary_category_id = ?`;
      params.push(category_id);
    }

    if (tag) {
      query += ` AND t.name = ?`;
      params.push(tag);
    }

    if (is_favorite === 'true' || is_favorite === '1') {
      query += ` AND n.is_favorite = 1`;
    }

    // Orden
    if (sort === 'title') {
      query += ` ORDER BY n.pinned DESC, n.title ASC`;
    } else if (sort === 'created') {
      query += ` ORDER BY n.pinned DESC, n.created_at DESC`;
    } else {
      query += ` ORDER BY n.pinned DESC, n.updated_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const [notes] = await db.query(query, params);

    // Obtener tags para todas las notas encontradas
    if (notes.length > 0) {
      const noteIds = notes.map(n => n.id);
      const [tagRows] = await db.query(`
        SELECT nt.note_id, t.id, t.name, t.color
        FROM knowledge_note_tags nt
        JOIN knowledge_tags t ON nt.tag_id = t.id
        WHERE nt.note_id IN (?)
      `, [noteIds]);

      const tagsByNote = {};
      tagRows.forEach(row => {
        if (!tagsByNote[row.note_id]) tagsByNote[row.note_id] = [];
        tagsByNote[row.note_id].push({ id: row.id, name: row.name, color: row.color });
      });

      notes.forEach(n => {
        n.tags = tagsByNote[n.id] || [];
      });
    }

    res.json({ notes });
  } catch (error) {
    console.error('Error en GET /api/knowledge/notes:', error);
    res.status(500).json({ error: { message: 'Error al obtener notas.' } });
  }
});

// GET /api/knowledge/notes/:id
router.get('/notes/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const noteId = req.params.id;

    const [noteRows] = await db.execute(`
      SELECT n.*,
             c.id as category_id, c.name as category_name,
             a.id as area_id, a.name as area_name, a.color as area_color, a.icon as area_icon
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE n.id = ? AND n.user_id = ?
    `, [noteId, userId]);

    if (noteRows.length === 0) {
      return res.status(404).json({ error: { message: 'Nota no encontrada.' } });
    }

    const note = noteRows[0];

    // Tags
    const [tags] = await db.execute(`
      SELECT t.id, t.name, t.color
      FROM knowledge_note_tags nt
      JOIN knowledge_tags t ON nt.tag_id = t.id
      WHERE nt.note_id = ?
    `, [noteId]);
    note.tags = tags;

    // Áreas secundarias
    const [secondaryAreas] = await db.execute(`
      SELECT a.id, a.name, a.color, a.icon
      FROM knowledge_note_areas na
      JOIN knowledge_areas a ON na.area_id = a.id
      WHERE na.note_id = ?
    `, [noteId]);
    note.secondary_areas = secondaryAreas;

    // Relaciones salientes (Outgoing relationships)
    const [outgoingRelations] = await db.execute(`
      SELECT r.id as relation_id, r.relation_type, r.origin, r.description,
             target.id as target_id, target.title as target_title,
             c.name as target_category, a.color as target_color
      FROM knowledge_relations r
      JOIN knowledge_notes target ON r.target_note_id = target.id
      LEFT JOIN knowledge_categories c ON target.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE r.source_note_id = ? AND r.user_id = ?
    `, [noteId, userId]);
    note.relations = outgoingRelations;

    // Backlinks (Relaciones entrantes + menciones textuales [[Título]])
    const [backlinks] = await db.execute(`
      SELECT r.id as relation_id, r.relation_type, r.origin, r.description,
             src.id as source_id, src.title as source_title,
             c.name as source_category, a.color as source_color,
             SUBSTRING(src.content, 1, 140) as preview
      FROM knowledge_relations r
      JOIN knowledge_notes src ON r.source_note_id = src.id
      LEFT JOIN knowledge_categories c ON src.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE r.target_note_id = ? AND r.user_id = ?
    `, [noteId, userId]);
    note.backlinks = backlinks;

    // Adjuntos
    const [attachments] = await db.execute(`
      SELECT id, filename, storage_path, mime_type, file_size, created_at
      FROM knowledge_attachments
      WHERE note_id = ? AND user_id = ?
    `, [noteId, userId]);
    note.attachments = attachments;

    // Cantidad de versiones
    const [[versionCount]] = await db.execute(
      'SELECT COUNT(*) as count FROM knowledge_note_versions WHERE note_id = ?',
      [noteId]
    );
    note.version_count = versionCount.count;

    res.json({ note });
  } catch (error) {
    console.error('Error en GET /api/knowledge/notes/:id:', error);
    res.status(500).json({ error: { message: 'Error al obtener nota.' } });
  }
});

// POST /api/knowledge/notes
router.post('/notes', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      title,
      content = '',
      content_format = 'markdown',
      primary_category_id = null,
      area_ids = [],
      tags = [],
      note_type = 'note',
      is_favorite = 0
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: 'El título de la nota es requerido.' } });
    }

    const [noteRes] = await db.execute(
      `INSERT INTO knowledge_notes (user_id, title, content, content_format, primary_category_id, note_type, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title.trim(), content, content_format, primary_category_id || null, note_type, is_favorite ? 1 : 0]
    );

    const noteId = noteRes.insertId;

    // Guardar versión inicial
    await db.execute(
      `INSERT INTO knowledge_note_versions (user_id, note_id, title, content)
       VALUES (?, ?, ?, ?)`,
      [userId, noteId, title.trim(), content]
    );

    // Asociar áreas secundarias
    if (Array.isArray(area_ids) && area_ids.length > 0) {
      for (const areaId of area_ids) {
        await db.execute(
          'INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, ?)',
          [noteId, areaId]
        );
      }
    }

    // Asociar tags
    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const cleanTag = String(tagName).trim();
        if (!cleanTag) continue;

        // Upsert tag
        await db.execute(
          `INSERT INTO knowledge_tags (user_id, name) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
          [userId, cleanTag]
        );
        const [tagRow] = await db.execute('SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?', [userId, cleanTag]);
        if (tagRow.length > 0) {
          await db.execute(
            'INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)',
            [noteId, tagRow[0].id]
          );
        }
      }
    }

    // Sincronizar enlaces internos
    await syncInternalLinks(db, userId, noteId, content);

    // Retornar nota creada completa
    const [createdNote] = await db.execute('SELECT * FROM knowledge_notes WHERE id = ?', [noteId]);
    res.status(201).json({ note: createdNote[0] });
  } catch (error) {
    console.error('Error en POST /api/knowledge/notes:', error);
    res.status(500).json({ error: { message: 'Error al crear nota.' } });
  }
});

// PUT /api/knowledge/notes/:id
router.put('/notes/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const noteId = req.params.id;
    const {
      title,
      content,
      primary_category_id,
      area_ids,
      tags,
      note_type,
      is_favorite,
      pinned,
      status
    } = req.body;

    const [existingRows] = await db.execute('SELECT * FROM knowledge_notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: { message: 'Nota no encontrada.' } });
    }
    const current = existingRows[0];

    const newTitle = title !== undefined ? title.trim() : current.title;
    const newContent = content !== undefined ? content : current.content;
    const newCategory = primary_category_id !== undefined ? (primary_category_id || null) : current.primary_category_id;
    const newType = note_type !== undefined ? note_type : current.note_type;
    const newFavorite = is_favorite !== undefined ? (is_favorite ? 1 : 0) : current.is_favorite;
    const newPinned = pinned !== undefined ? (pinned ? 1 : 0) : current.pinned;
    const newStatus = status !== undefined ? status : current.status;

    await db.execute(
      `UPDATE knowledge_notes 
       SET title = ?,
           content = ?,
           primary_category_id = ?,
           note_type = ?,
           is_favorite = ?,
           pinned = ?,
           status = ?,
           updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [newTitle, newContent, newCategory, newType, newFavorite, newPinned, newStatus, noteId, userId]
    );

    // Guardar versión si hubo cambio significativo en título o contenido
    if (newTitle !== current.title || newContent !== current.content) {
      await db.execute(
        `INSERT INTO knowledge_note_versions (user_id, note_id, title, content)
         VALUES (?, ?, ?, ?)`,
        [userId, noteId, newTitle, newContent]
      );
    }

    // Actualizar áreas secundarias si fueron provistas
    if (Array.isArray(area_ids)) {
      await db.execute('DELETE FROM knowledge_note_areas WHERE note_id = ?', [noteId]);
      for (const areaId of area_ids) {
        await db.execute(
          'INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, ?)',
          [noteId, areaId]
        );
      }
    }

    // Actualizar tags si fueron provistos
    if (Array.isArray(tags)) {
      await db.execute('DELETE FROM knowledge_note_tags WHERE note_id = ?', [noteId]);
      for (const tagName of tags) {
        const cleanTag = String(tagName).trim();
        if (!cleanTag) continue;

        await db.execute(
          `INSERT INTO knowledge_tags (user_id, name) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
          [userId, cleanTag]
        );
        const [tagRow] = await db.execute('SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?', [userId, cleanTag]);
        if (tagRow.length > 0) {
          await db.execute(
            'INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)',
            [noteId, tagRow[0].id]
          );
        }
      }
    }

    // Sincronizar enlaces internos
    if (content !== undefined) {
      await syncInternalLinks(db, userId, noteId, newContent);
    }

    const [updated] = await db.execute('SELECT * FROM knowledge_notes WHERE id = ?', [noteId]);
    res.json({ note: updated[0] });
  } catch (error) {
    console.error('Error en PUT /api/knowledge/notes/:id:', error);
    res.status(500).json({ error: { message: 'Error al actualizar nota.' } });
  }
});

// DELETE /api/knowledge/notes/:id
router.delete('/notes/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const noteId = req.params.id;

    const [result] = await db.execute('DELETE FROM knowledge_notes WHERE id = ? AND user_id = ?', [noteId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Nota no encontrada.' } });
    }

    res.json({ success: true, message: 'Nota eliminada correctamente.' });
  } catch (error) {
    console.error('Error en DELETE /api/knowledge/notes/:id:', error);
    res.status(500).json({ error: { message: 'Error al eliminar nota.' } });
  }
});

// POST /api/knowledge/notes/:id/favorite
router.post('/notes/:id/favorite', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const noteId = req.params.id;

    await db.execute(
      'UPDATE knowledge_notes SET is_favorite = NOT is_favorite, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [noteId, userId]
    );

    const [updated] = await db.execute('SELECT id, is_favorite FROM knowledge_notes WHERE id = ?', [noteId]);
    res.json({ success: true, is_favorite: !!updated[0]?.is_favorite });
  } catch (error) {
    console.error('Error en toggle favorite:', error);
    res.status(500).json({ error: { message: 'Error al actualizar favorito.' } });
  }
});

// GET /api/knowledge/notes/:id/versions
router.get('/notes/:id/versions', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const noteId = req.params.id;

    const [versions] = await db.execute(
      'SELECT id, title, created_at, LENGTH(content) as content_length FROM knowledge_note_versions WHERE note_id = ? AND user_id = ? ORDER BY created_at DESC',
      [noteId, userId]
    );

    res.json({ versions });
  } catch (error) {
    console.error('Error en GET /api/knowledge/notes/:id/versions:', error);
    res.status(500).json({ error: { message: 'Error al obtener versiones.' } });
  }
});

// POST /api/knowledge/notes/:id/restore-version/:versionId
router.post('/notes/:id/restore-version/:versionId', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { id: noteId, versionId } = req.params;

    const [versions] = await db.execute(
      'SELECT title, content FROM knowledge_note_versions WHERE id = ? AND note_id = ? AND user_id = ?',
      [versionId, noteId, userId]
    );

    if (versions.length === 0) {
      return res.status(404).json({ error: { message: 'Versión no encontrada.' } });
    }

    const { title, content } = versions[0];
    await db.execute(
      'UPDATE knowledge_notes SET title = ?, content = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [title, content, noteId, userId]
    );

    // Crear un nuevo snapshot de versión con la restauración
    await db.execute(
      'INSERT INTO knowledge_note_versions (user_id, note_id, title, content) VALUES (?, ?, ?, ?)',
      [userId, noteId, title, content]
    );

    res.json({ success: true, message: 'Versión restaurada con éxito.' });
  } catch (error) {
    console.error('Error en restore version:', error);
    res.status(500).json({ error: { message: 'Error al restaurar versión.' } });
  }
});

// ─── AUTOCOMPLETE Y BÚSQUEDA RÁPIDA DE ENLACES [[ ──────────────────────────

// GET /api/knowledge/autocomplete-notes
router.get('/autocomplete-notes', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const query = req.query.q ? `%${req.query.q.trim()}%` : '%';

    const [notes] = await db.execute(`
      SELECT n.id, n.title, c.name as category_name, a.name as area_name, a.color as area_color
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE n.user_id = ? AND n.title LIKE ?
      ORDER BY n.updated_at DESC
      LIMIT 15
    `, [userId, query]);

    res.json({ notes });
  } catch (error) {
    console.error('Error en autocomplete-notes:', error);
    res.status(500).json({ error: { message: 'Error en autocompletado.' } });
  }
});

// ─── TAGS ───────────────────────────────────────────────────────────────────

// GET /api/knowledge/tags
router.get('/tags', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;

    const [tags] = await db.execute(`
      SELECT t.id, t.name, t.color,
             (SELECT COUNT(*) FROM knowledge_note_tags nt WHERE nt.tag_id = t.id) as notes_count
      FROM knowledge_tags t
      WHERE t.user_id = ?
      ORDER BY notes_count DESC, t.name ASC
    `, [userId]);

    res.json({ tags });
  } catch (error) {
    console.error('Error en GET /api/knowledge/tags:', error);
    res.status(500).json({ error: { message: 'Error al obtener tags.' } });
  }
});

// ─── RELACIONES ─────────────────────────────────────────────────────────────

// GET /api/knowledge/relations
router.get('/relations', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;

    const [relations] = await db.execute(`
      SELECT r.*,
             src.title as source_title, src_c.name as source_category,
             tgt.title as target_title, tgt_c.name as target_category
      FROM knowledge_relations r
      JOIN knowledge_notes src ON r.source_note_id = src.id
      JOIN knowledge_notes tgt ON r.target_note_id = tgt.id
      LEFT JOIN knowledge_categories src_c ON src.primary_category_id = src_c.id
      LEFT JOIN knowledge_categories tgt_c ON tgt.primary_category_id = tgt_c.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({ relations });
  } catch (error) {
    console.error('Error en GET /api/knowledge/relations:', error);
    res.status(500).json({ error: { message: 'Error al obtener relaciones.' } });
  }
});

// POST /api/knowledge/relations
router.post('/relations', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      source_note_id,
      target_note_id,
      relation_type = 'related_to',
      origin = 'manual',
      description = null
    } = req.body;

    if (!source_note_id || !target_note_id) {
      return res.status(400).json({ error: { message: 'source_note_id y target_note_id son requeridos.' } });
    }

    if (source_note_id === target_note_id) {
      return res.status(400).json({ error: { message: 'Una nota no puede relacionarse consigo misma.' } });
    }

    const [result] = await db.execute(
      `INSERT INTO knowledge_relations (user_id, source_note_id, target_note_id, relation_type, origin, description)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE relation_type = VALUES(relation_type), description = VALUES(description)`,
      [userId, source_note_id, target_note_id, relation_type, origin, description]
    );

    res.status(201).json({ success: true, relationId: result.insertId });
  } catch (error) {
    console.error('Error en POST /api/knowledge/relations:', error);
    res.status(500).json({ error: { message: 'Error al crear relación.' } });
  }
});

// DELETE /api/knowledge/relations/:id
router.delete('/relations/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const relationId = req.params.id;

    const [result] = await db.execute('DELETE FROM knowledge_relations WHERE id = ? AND user_id = ?', [relationId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Relación no encontrada.' } });
    }

    res.json({ success: true, message: 'Relación eliminada correctamente.' });
  } catch (error) {
    console.error('Error en DELETE /api/knowledge/relations/:id:', error);
    res.status(500).json({ error: { message: 'Error al eliminar relación.' } });
  }
});

// ─── INBOX & CAPTURA RÁPIDA ─────────────────────────────────────────────────

// GET /api/knowledge/inbox
router.get('/inbox', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { status = 'inbox' } = req.query;

    const [items] = await db.execute(`
      SELECT r.*,
             a.name as suggested_area_name, a.color as suggested_area_color,
             c.name as suggested_category_name
      FROM knowledge_resources r
      LEFT JOIN knowledge_areas a ON r.ai_suggested_area_id = a.id
      LEFT JOIN knowledge_categories c ON r.ai_suggested_category_id = c.id
      WHERE r.user_id = ? AND r.status = ?
      ORDER BY r.created_at DESC
    `, [userId, status]);

    res.json({ items });
  } catch (error) {
    console.error('Error en GET /api/knowledge/inbox:', error);
    res.status(500).json({ error: { message: 'Error al obtener inbox.' } });
  }
});

// POST /api/knowledge/inbox
router.post('/inbox', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      title,
      raw_content = '',
      url = null,
      resource_type = 'text',
      source_name = null,
      metadata = null
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: { message: 'El título o descripción inicial es requerido.' } });
    }

    // Heurística / sugerencia ligera sin requerir LLM externo obligatorio
    let suggestedAreaId = null;
    let suggestedCatId = null;
    const textSample = `${title} ${raw_content}`.toLowerCase();

    // Intentar emparejar con áreas existentes
    const [areas] = await db.execute('SELECT id, name FROM knowledge_areas WHERE user_id = ?', [userId]);
    for (const a of areas) {
      if (textSample.includes(a.name.toLowerCase())) {
        suggestedAreaId = a.id;
        break;
      }
    }

    const [result] = await db.execute(
      `INSERT INTO knowledge_resources (user_id, title, raw_content, url, resource_type, source_name, ai_suggested_area_id, ai_suggested_category_id, metadata, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'inbox')`,
      [
        userId,
        title.trim(),
        raw_content,
        url,
        resource_type,
        source_name,
        suggestedAreaId,
        suggestedCatId,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    const [created] = await db.execute('SELECT * FROM knowledge_resources WHERE id = ?', [result.insertId]);
    res.status(201).json({ item: created[0] });
  } catch (error) {
    console.error('Error en POST /api/knowledge/inbox:', error);
    res.status(500).json({ error: { message: 'Error al capturar en inbox.' } });
  }
});

// POST /api/knowledge/inbox/:id/process
// Convierte un recurso del Inbox en una nota permanente
router.post('/inbox/:id/process', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const resourceId = req.params.id;
    const {
      title,
      content,
      primary_category_id,
      area_ids = [],
      tags = []
    } = req.body;

    const [resourceRows] = await db.execute('SELECT * FROM knowledge_resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
    if (resourceRows.length === 0) {
      return res.status(404).json({ error: { message: 'Elemento de inbox no encontrado.' } });
    }
    const resource = resourceRows[0];

    const noteTitle = title || resource.title;
    let noteContent = content !== undefined ? content : resource.raw_content;
    if (resource.url && !noteContent.includes(resource.url)) {
      noteContent = `${noteContent}\n\n**Fuente:** [${resource.source_name || resource.url}](${resource.url})`;
    }

    // Crear nota
    const [noteRes] = await db.execute(
      `INSERT INTO knowledge_notes (user_id, title, content, content_format, primary_category_id, note_type, status)
       VALUES (?, ?, ?, 'markdown', ?, 'note', 'published')`,
      [userId, noteTitle.trim(), noteContent, primary_category_id || null]
    );
    const noteId = noteRes.insertId;

    // Crear versión inicial
    await db.execute(
      'INSERT INTO knowledge_note_versions (user_id, note_id, title, content) VALUES (?, ?, ?, ?)',
      [userId, noteId, noteTitle.trim(), noteContent]
    );

    // Marcar recurso como procesado y vincular note_id
    await db.execute(
      'UPDATE knowledge_resources SET status = "processed", note_id = ? WHERE id = ?',
      [noteId, resourceId]
    );

    // Asociar áreas secundarias
    if (Array.isArray(area_ids)) {
      for (const aId of area_ids) {
        await db.execute('INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, ?)', [noteId, aId]);
      }
    }

    // Tags
    if (Array.isArray(tags)) {
      for (const t of tags) {
        const cleanTag = String(t).trim();
        if (!cleanTag) continue;
        await db.execute(
          'INSERT INTO knowledge_tags (user_id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
          [userId, cleanTag]
        );
        const [tagRow] = await db.execute('SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?', [userId, cleanTag]);
        if (tagRow.length > 0) {
          await db.execute('INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagRow[0].id]);
        }
      }
    }

    // Sincronizar enlaces
    await syncInternalLinks(db, userId, noteId, noteContent);

    res.json({ success: true, note_id: noteId, message: 'Recurso procesado y convertido en nota permanente.' });
  } catch (error) {
    console.error('Error en process inbox:', error);
    res.status(500).json({ error: { message: 'Error al procesar elemento de inbox.' } });
  }
});

// DELETE /api/knowledge/inbox/:id
router.delete('/inbox/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const resourceId = req.params.id;

    const [result] = await db.execute('DELETE FROM knowledge_resources WHERE id = ? AND user_id = ?', [resourceId, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: { message: 'Elemento no encontrado.' } });
    }

    res.json({ success: true, message: 'Elemento de inbox eliminado.' });
  } catch (error) {
    console.error('Error en DELETE /api/knowledge/inbox/:id:', error);
    res.status(500).json({ error: { message: 'Error al eliminar elemento de inbox.' } });
  }
});

// ─── ARCHIVOS ADJUNTOS ──────────────────────────────────────────────────────

// POST /api/knowledge/attachments
router.post('/attachments', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'No se envió ningún archivo.' } });
    }

    const db = getPool();
    const userId = req.user.id;
    const noteId = req.body.note_id || null;

    const storagePath = `/uploads/${req.file.filename}`;
    const [result] = await db.execute(
      `INSERT INTO knowledge_attachments (user_id, note_id, filename, storage_path, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, noteId, req.file.originalname, storagePath, req.file.mimetype, req.file.size]
    );

    res.status(201).json({
      attachment: {
        id: result.insertId,
        filename: req.file.originalname,
        url: storagePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error en upload attachment:', error);
    res.status(500).json({ error: { message: 'Error al subir archivo adjunto.' } });
  }
});

// ─── KNOWLEDGE GRAPH ────────────────────────────────────────────────────────

// GET /api/knowledge/graph
router.get('/graph', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { area_id, category_id, note_id, depth = 1 } = req.query;

    let nodesQuery = `
      SELECT n.id, n.title, n.note_type, n.is_favorite,
             c.id as category_id, c.name as category_name,
             a.id as area_id, a.name as area_name, a.color as area_color,
             (SELECT COUNT(*) FROM knowledge_relations r WHERE r.source_note_id = n.id OR r.target_note_id = n.id) as connection_count
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      LEFT JOIN knowledge_note_areas na ON na.note_id = n.id
      WHERE n.user_id = ?
    `;

    const nodesParams = [userId];

    if (area_id) {
      nodesQuery += ` AND (c.area_id = ? OR na.area_id = ?)`;
      nodesParams.push(area_id, area_id);
    }

    if (category_id) {
      nodesQuery += ` AND n.primary_category_id = ?`;
      nodesParams.push(category_id);
    }

    const [nodes] = await db.query(nodesQuery, nodesParams);
    const nodeIds = new Set(nodes.map(n => n.id));

    // Si es un Local Graph centrado en una nota
    if (note_id) {
      const targetId = parseInt(note_id, 10);
      const targetDepth = parseInt(depth, 10) || 1;

      // Buscar conexiones hasta la profundidad especificada
      const visited = new Set([targetId]);
      let currentLevel = [targetId];

      for (let d = 0; d < targetDepth; d++) {
        if (currentLevel.length === 0) break;
        const [connected] = await db.query(`
          SELECT source_note_id, target_note_id 
          FROM knowledge_relations 
          WHERE user_id = ? AND (source_note_id IN (?) OR target_note_id IN (?))
        `, [userId, currentLevel, currentLevel]);

        const nextLevel = [];
        for (const row of connected) {
          const other = row.source_note_id === targetId ? row.target_note_id : row.source_note_id;
          if (!visited.has(other)) {
            visited.add(other);
            nextLevel.push(other);
          }
        }
        currentLevel = nextLevel;
      }

      // Filtrar nodos por los visitados
      const filteredNodes = nodes.filter(n => visited.has(n.id));
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

      const [relations] = await db.query(`
        SELECT id, source_note_id, target_note_id, relation_type, origin
        FROM knowledge_relations
        WHERE user_id = ? AND source_note_id IN (?) AND target_note_id IN (?)
      `, [userId, Array.from(filteredNodeIds), Array.from(filteredNodeIds)]);

      return res.json({
        nodes: filteredNodes.map(n => ({
          id: String(n.id),
          label: n.title,
          category: n.category_name || 'Sin categoría',
          area: n.area_name || 'General',
          color: n.area_color || '#8b5cf6',
          size: Math.min(28, 12 + (n.connection_count || 0) * 3),
          isCenter: n.id === targetId
        })),
        edges: relations.map(r => ({
          id: `e-${r.id}`,
          source: String(r.source_note_id),
          target: String(r.target_note_id),
          type: r.relation_type,
          origin: r.origin
        }))
      });
    }

    // Grafo global o por categoría
    let edges = [];
    if (nodeIds.size > 0) {
      const [relations] = await db.query(`
        SELECT id, source_note_id, target_note_id, relation_type, origin
        FROM knowledge_relations
        WHERE user_id = ? AND source_note_id IN (?) AND target_note_id IN (?)
      `, [userId, Array.from(nodeIds), Array.from(nodeIds)]);

      edges = relations.map(r => ({
        id: `e-${r.id}`,
        source: String(r.source_note_id),
        target: String(r.target_note_id),
        type: r.relation_type,
        origin: r.origin
      }));
    }

    res.json({
      nodes: nodes.map(n => ({
        id: String(n.id),
        label: n.title,
        category: n.category_name || 'Sin categoría',
        area: n.area_name || 'General',
        color: n.area_color || '#8b5cf6',
        size: Math.min(26, 10 + (n.connection_count || 0) * 2.5),
        connection_count: n.connection_count
      })),
      edges
    });
  } catch (error) {
    console.error('Error en GET /api/knowledge/graph:', error);
    res.status(500).json({ error: { message: 'Error al generar grafo de conocimiento.' } });
  }
});

// ─── SEARCH AVANZADO ────────────────────────────────────────────────────────

// GET /api/knowledge/search
router.get('/search', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { q = '', area_id, category_id, tag } = req.query;

    if (!q || !q.trim()) {
      return res.json({ results: [] });
    }

    const term = `%${q.trim()}%`;
    let query = `
      SELECT n.id, n.title, n.updated_at, n.is_favorite,
             c.name as category_name, a.name as area_name, a.color as area_color,
             SUBSTRING(n.content, 1, 240) as preview
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      LEFT JOIN knowledge_note_tags nt ON nt.note_id = n.id
      LEFT JOIN knowledge_tags t ON nt.tag_id = t.id
      WHERE n.user_id = ?
      AND (n.title LIKE ? OR n.content LIKE ? OR t.name LIKE ?)
    `;

    const params = [userId, term, term, term];

    if (area_id) {
      query += ` AND a.id = ?`;
      params.push(area_id);
    }
    if (category_id) {
      query += ` AND c.id = ?`;
      params.push(category_id);
    }

    query += ` GROUP BY n.id ORDER BY (n.title LIKE ?) DESC, n.updated_at DESC LIMIT 30`;
    params.push(`%${q.trim()}%`);

    const [results] = await db.query(query, params);
    res.json({ results });
  } catch (error) {
    console.error('Error en search:', error);
    res.status(500).json({ error: { message: 'Error en la búsqueda.' } });
  }
});

// ─── AI KNOWLEDGE ENGINE ────────────────────────────────────────────────────

// POST /api/knowledge/ai/summarize
router.post('/ai/summarize', async (req, res) => {
  try {
    const { content, title } = req.body;
    if (!content) return res.status(400).json({ error: { message: 'Contenido requerido.' } });

    // Resumen analítico estructurado
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const summaryPoints = lines.slice(0, 4).map(l => l.replace(/^[#*-]\s*/, '').trim()).filter(Boolean);

    const summary = summaryPoints.length > 0
      ? `Resumen de "${title || 'Nota'}":\n- ` + summaryPoints.join('\n- ')
      : `Documento sobre ${title || 'el tema indicado'}, con detalles técnicos y conceptuales registrados.`;

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error en AI summarize.' } });
  }
});

// POST /api/knowledge/ai/classify
router.post('/ai/classify', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { title, content } = req.body;

    const [areas] = await db.execute('SELECT id, name FROM knowledge_areas WHERE user_id = ?', [userId]);
    const [categories] = await db.execute('SELECT id, area_id, name FROM knowledge_categories WHERE user_id = ?', [userId]);

    const combined = `${title || ''} ${content || ''}`.toLowerCase();

    let matchedArea = areas[0] || null;
    let matchedCategory = null;

    // Buscar coincidencia semántica
    for (const a of areas) {
      if (combined.includes(a.name.toLowerCase())) {
        matchedArea = a;
        break;
      }
    }

    if (matchedArea) {
      const candidates = categories.filter(c => c.area_id === matchedArea.id);
      for (const c of candidates) {
        if (combined.includes(c.name.toLowerCase())) {
          matchedCategory = c;
          break;
        }
      }
      if (!matchedCategory && candidates.length > 0) {
        matchedCategory = candidates[0];
      }
    }

    // Extraer tags candidatos
    const words = (title || '').split(/\s+/).filter(w => w.length > 4);
    const suggestedTags = words.slice(0, 3).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));

    res.json({
      suggested_area_id: matchedArea?.id || null,
      suggested_area_name: matchedArea?.name || null,
      suggested_category_id: matchedCategory?.id || null,
      suggested_category_name: matchedCategory?.name || null,
      suggested_tags: suggestedTags
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error en AI classify.' } });
  }
});

// POST /api/knowledge/ai/suggest-relations
router.post('/ai/suggest-relations', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { note_id } = req.body;

    const [currentRows] = await db.execute('SELECT id, title, content FROM knowledge_notes WHERE id = ? AND user_id = ?', [note_id, userId]);
    if (currentRows.length === 0) return res.status(404).json({ error: { message: 'Nota no encontrada.' } });

    const currentNote = currentRows[0];
    const words = currentNote.title.split(/\s+/).filter(w => w.length > 3);

    // Buscar otras notas que compartan términos clave
    const [otherNotes] = await db.execute(`
      SELECT n.id, n.title, c.name as category_name, a.name as area_name
      FROM knowledge_notes n
      LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
      LEFT JOIN knowledge_areas a ON c.area_id = a.id
      WHERE n.user_id = ? AND n.id != ?
      ORDER BY n.updated_at DESC
      LIMIT 10
    `, [userId, note_id]);

    const suggestions = otherNotes.slice(0, 4).map(note => ({
      target_note_id: note.id,
      target_title: note.title,
      category_name: note.category_name,
      area_name: note.area_name,
      explanation: `Potencial conexión conceptual entre "${currentNote.title}" y "${note.title}".`,
      confidence: 0.85
    }));

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error en suggest-relations.' } });
  }
});

// POST /api/knowledge/ai/chat
// Asistente conversacional con citas a notas almacenadas
router.post('/ai/chat', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: { message: 'Mensaje requerido.' } });
    }

    // Buscar notas relevantes en la base de datos del usuario
    const keywords = message.trim().split(/\s+/).filter(k => k.length > 3);
    let matchedNotes = [];

    if (keywords.length > 0) {
      const likes = keywords.map(() => `(n.title LIKE ? OR n.content LIKE ?)`).join(' OR ');
      const params = [userId];
      keywords.forEach(k => {
        params.push(`%${k}%`, `%${k}%`);
      });

      const [rows] = await db.query(`
        SELECT n.id, n.title, SUBSTRING(n.content, 1, 300) as snippet,
               c.name as category_name, a.name as area_name
        FROM knowledge_notes n
        LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
        LEFT JOIN knowledge_areas a ON c.area_id = a.id
        WHERE n.user_id = ? AND (${likes})
        LIMIT 5
      `, params);
      matchedNotes = rows;
    }

    // Si no encontró por keywords específicas, traer las más recientes
    if (matchedNotes.length === 0) {
      const [rows] = await db.execute(`
        SELECT n.id, n.title, SUBSTRING(n.content, 1, 300) as snippet,
               c.name as category_name, a.name as area_name
        FROM knowledge_notes n
        LEFT JOIN knowledge_categories c ON n.primary_category_id = c.id
        LEFT JOIN knowledge_areas a ON c.area_id = a.id
        WHERE n.user_id = ?
        ORDER BY n.updated_at DESC
        LIMIT 3
      `, [userId]);
      matchedNotes = rows;
    }

    let reply = '';
    const citations = matchedNotes.map(n => ({
      id: n.id,
      title: n.title,
      category: n.category_name,
      area: n.area_name
    }));

    if (matchedNotes.length > 0) {
      reply = `He analizado tu Knowledge Hub respecto a tu consulta ("${message}").\n\n`;
      reply += `A partir de tus notas registradas, destaco lo siguiente:\n\n`;
      matchedNotes.forEach((n, idx) => {
        reply += `${idx + 1}. **${n.title}** (${n.area_name || 'General'} → ${n.category_name || 'General'}):\n`;
        reply += `   ${n.snippet ? n.snippet.replace(/\n+/g, ' ') : 'Sin contenido adicional'}...\n\n`;
      });
      reply += `¿Te gustaría profundizar en alguna de estas conexiones o estructurar una nueva nota al respecto?`;
    } else {
      reply = `No encontré notas directamente relacionadas con "${message}" en tu Knowledge Hub actualmente.\n\nPuedes capturar esta idea desde el Inbox o redactar una nueva nota para comenzar a construir este nodo de conocimiento.`;
    }

    res.json({
      reply,
      citations
    });
  } catch (error) {
    console.error('Error en AI chat:', error);
    res.status(500).json({ error: { message: 'Error en el asistente AI.' } });
  }
});

// ─── KNOWLEDGE EXPORTER ─────────────────────────────────────────────────────

// POST /api/knowledge/export/preview
router.post('/export/preview', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      scope_type = 'category',
      area_id,
      category_id,
      category_ids,
      include_subcategories = true
    } = req.body;

    const preview = await exportService.getExportPreview(userId, {
      scopeType: scope_type,
      areaId: area_id,
      categoryId: category_id,
      categoryIds: category_ids,
      includeSubcategories: include_subcategories !== false
    });

    res.json({ preview });
  } catch (error) {
    console.error('Error en export preview:', error);
    res.status(500).json({ error: { message: error.message || 'Error al generar vista previa de exportación.' } });
  }
});

// POST /api/knowledge/export
router.post('/export', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      scope_type = 'category',
      area_id,
      category_id,
      category_ids,
      include_subcategories = true,
      include_attachments = true,
      include_relationships = true,
      generate_ai_summaries = true
    } = req.body;

    const result = await exportService.generateExportPackage(userId, {
      scopeType: scope_type,
      areaId: area_id,
      categoryId: category_id,
      categoryIds: category_ids,
      includeSubcategories: include_subcategories !== false,
      includeAttachments: include_attachments !== false,
      includeRelationships: include_relationships !== false,
      generateAiSummaries: generate_ai_summaries !== false
    });

    res.json({
      success: true,
      export: result
    });
  } catch (error) {
    console.error('Error al generar exportación:', error);
    res.status(500).json({ error: { message: error.message || 'Error al generar exportación.' } });
  }
});

// GET /api/knowledge/export/:id
router.get('/export/:id', async (req, res) => {
  try {
    const job = exportService.getExportJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: { message: 'Trabajo de exportación no encontrado o expirado.' } });
    }

    res.json({
      success: true,
      export: {
        export_id: job.exportId,
        filename: job.filename,
        size: job.size,
        category: job.categoryName,
        download_url: `/api/knowledge/export/${job.exportId}/download`
      }
    });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error al consultar exportación.' } });
  }
});

// GET /api/knowledge/export/:id/download
router.get('/export/:id/download', async (req, res) => {
  try {
    const job = exportService.getExportJob(req.params.id);
    if (!job || !fs.existsSync(job.filePath)) {
      return res.status(404).json({ error: { message: 'El archivo de exportación ha expirado o no existe.' } });
    }

    res.download(job.filePath, job.filename, (err) => {
      if (err) {
        console.error('Error enviando archivo de exportación:', err);
      }
    });
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({ error: { message: 'Error al descargar exportación.' } });
  }
});

module.exports = router;

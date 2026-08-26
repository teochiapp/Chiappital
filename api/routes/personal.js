// routes/personal.js - Rutas para el Personal Hub
const express = require('express');
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// Helper para obtener YYYY-MM-DD en UTC-3
const getUTC3DateString = (date = new Date()) => {
  const tzOffset = 3 * 60 * 60 * 1000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
};

const router = express.Router();
router.use(authenticate);

// ─── Feature Flags ────────────────────────────────────────────────────────────

// GET /api/personal/features
router.get('/features', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [rows] = await db.execute(
      'SELECT feature_name, enabled FROM features WHERE user_id = ?',
      [userId]
    );
    const features = {};
    rows.forEach(r => { features[r.feature_name] = !!r.enabled; });
    // Defaults si no existen aún
    if (!('personal_hub' in features)) features.personal_hub = false;
    if (!('investment_hub' in features)) features.investment_hub = true;
    res.json({ features });
  } catch (error) {
    console.error('Error obteniendo features:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/features
router.put('/features', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { feature_name, enabled } = req.body;
    if (!feature_name) return res.status(400).json({ error: { message: 'feature_name requerido.' } });

    await db.execute(
      `INSERT INTO features (user_id, feature_name, enabled)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)`,
      [userId, feature_name, enabled ? 1 : 0]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando feature:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Hábitos ──────────────────────────────────────────────────────────────────

// GET /api/personal/habits
router.get('/habits', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [habits] = await db.execute(
      'SELECT * FROM habits WHERE user_id = ? AND active = 1 ORDER BY created_at ASC',
      [userId]
    );
    // Para cada hábito, traer completados de los últimos 90 días
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateStr = getUTC3DateString(ninetyDaysAgo);

    const [completions] = await db.execute(
      'SELECT habit_id, completed_on FROM habit_completions WHERE user_id = ? AND completed_on >= ?',
      [userId, dateStr]
    );

    const completionMap = {};
    completions.forEach(c => {
      if (!completionMap[c.habit_id]) completionMap[c.habit_id] = [];
      completionMap[c.habit_id].push(c.completed_on.toISOString().split('T')[0]);
    });

    const result = habits.map(h => ({
      ...h,
      completions: completionMap[h.id] || []
    }));

    res.json({ habits: result });
  } catch (error) {
    console.error('Error obteniendo hábitos:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/habits
router.post('/habits', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { name, description, frequency, color, icon, days_of_week } = req.body;
    if (!name) return res.status(400).json({ error: { message: 'name requerido.' } });

    const [result] = await db.execute(
      'INSERT INTO habits (user_id, name, description, frequency, days_of_week, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, description || null, frequency || 'daily', days_of_week ? JSON.stringify(days_of_week) : null, color || '#52B788', icon || null]
    );
    const [rows] = await db.execute('SELECT * FROM habits WHERE id = ?', [result.insertId]);
    res.status(201).json({ habit: { ...rows[0], completions: [] } });
  } catch (error) {
    console.error('Error creando hábito:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/habits/:id
router.put('/habits/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { name, description, frequency, color, icon, active, days_of_week } = req.body;
    await db.execute(
      `UPDATE habits SET name=COALESCE(?,name), description=COALESCE(?,description),
       frequency=COALESCE(?,frequency), days_of_week=COALESCE(?,days_of_week), color=COALESCE(?,color), icon=COALESCE(?,icon),
       active=COALESCE(?,active) WHERE id=? AND user_id=?`,
      [
        name !== undefined ? name : null,
        description !== undefined ? description : null,
        frequency !== undefined ? frequency : null,
        days_of_week !== undefined ? (days_of_week ? JSON.stringify(days_of_week) : null) : null,
        color !== undefined ? color : null,
        icon !== undefined ? icon : null,
        active !== undefined ? (active ? 1 : 0) : null,
        req.params.id,
        userId
      ]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando hábito:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/habits/:id
router.delete('/habits/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute(
      'UPDATE habits SET active = 0 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando hábito:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/habits/:id/toggle — marcar/desmarcar completado
router.post('/habits/:id/toggle', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const habitId = req.params.id;
    const targetDate = req.body.date || getUTC3DateString();

    const [existing] = await db.execute(
      'SELECT id FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_on = ?',
      [habitId, userId, targetDate]
    );

    if (existing.length > 0) {
      await db.execute('DELETE FROM habit_completions WHERE habit_id = ? AND user_id = ? AND completed_on = ?',
        [habitId, userId, targetDate]);
      res.json({ completed: false, date: targetDate });
    } else {
      await db.execute('INSERT INTO habit_completions (habit_id, user_id, completed_on) VALUES (?, ?, ?)',
        [habitId, userId, targetDate]);
      res.json({ completed: true, date: targetDate });
    }
  } catch (error) {
    console.error('Error toggling hábito:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Objetivos ────────────────────────────────────────────────────────────────

// GET /api/personal/goals
router.get('/goals', async (req, res) => {
  try {
    const db = getPool();
    const [goals] = await db.execute(
      'SELECT * FROM personal_goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ goals });
  } catch (error) {
    console.error('Error obteniendo objetivos:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/goals
router.post('/goals', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { title, description, category, deadline, progress } = req.body;
    if (!title) return res.status(400).json({ error: { message: 'title requerido.' } });

    const [result] = await db.execute(
      'INSERT INTO personal_goals (user_id, title, description, category, deadline, progress) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, title, description || null, category || 'desarrollo', deadline || null, progress || 0]
    );
    const [rows] = await db.execute('SELECT * FROM personal_goals WHERE id = ?', [result.insertId]);
    res.status(201).json({ goal: rows[0] });
  } catch (error) {
    console.error('Error creando objetivo:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/goals/:id
router.put('/goals/:id', async (req, res) => {
  try {
    const db = getPool();
    const { title, description, category, progress, deadline, status } = req.body;
    await db.execute(
      `UPDATE personal_goals SET
        title=COALESCE(?,title), description=COALESCE(?,description),
        category=COALESCE(?,category), progress=COALESCE(?,progress),
        deadline=COALESCE(?,deadline), status=COALESCE(?,status)
       WHERE id=? AND user_id=?`,
      [
        title !== undefined ? title : null,
        description !== undefined ? description : null,
        category !== undefined ? category : null,
        progress !== undefined ? progress : null,
        deadline !== undefined ? deadline : null,
        status !== undefined ? status : null,
        req.params.id,
        req.user.id
      ]
    );
    const [rows] = await db.execute('SELECT * FROM personal_goals WHERE id = ?', [req.params.id]);
    res.json({ goal: rows[0] });
  } catch (error) {
    console.error('Error actualizando objetivo:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/goals/:id
router.delete('/goals/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM personal_goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando objetivo:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Vocabulario (Idiomas) ───────────────────────────────────────────────────

// GET /api/personal/vocabulary
router.get('/vocabulary', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [vocabulary] = await db.execute(
      'SELECT * FROM vocabulary WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ vocabulary });
  } catch (error) {
    console.error('Error obteniendo vocabulario:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/vocabulary
router.post('/vocabulary', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { word, translation, language, notes } = req.body;
    if (!word || !translation) return res.status(400).json({ error: { message: 'word y translation requeridos.' } });

    const today = getUTC3DateString();

    const [result] = await db.execute(
      'INSERT INTO vocabulary (user_id, word, translation, language, notes, next_review) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, word, translation, language || 'portugués', notes || null, today]
    );
    const [rows] = await db.execute('SELECT * FROM vocabulary WHERE id = ?', [result.insertId]);
    res.status(201).json({ word: rows[0] });
  } catch (error) {
    console.error('Error creando vocabulario:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/vocabulary/:id/review
router.put('/vocabulary/:id/review', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { quality } = req.body; // 0=Again, 1=Hard, 2=Good, 3=Easy
    
    // Obtener la palabra actual
    const [rows] = await db.execute('SELECT * FROM vocabulary WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Palabra no encontrada.' } });
    
    const word = rows[0];
    let { repetition, ease_factor, interval_days } = word;

    ease_factor = ease_factor || 2.5;
    interval_days = interval_days || 0;

    // Algoritmo SM-2 simplificado y preciso
    if (quality === 0) {
      repetition = 0;
      interval_days = 0;
    } else if (quality === 1) {
      if (repetition === 0) {
        interval_days = 0;
      } else {
        interval_days = Math.max(1, Math.round(interval_days * 1.2));
        repetition += 1;
      }
    } else if (quality === 2) {
      if (repetition === 0) {
        interval_days = 1;
      } else if (repetition === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetition += 1;
    } else if (quality === 3) {
      if (repetition === 0) {
        interval_days = 4;
      } else if (repetition === 1) {
        interval_days = Math.round(6 * ease_factor);
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3); // Easy bonus
      }
      repetition += 1;
    }

    // Actualizar Ease Factor
    ease_factor = ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    // Calcular próxima fecha
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);
    const nextReviewStr = getUTC3DateString(nextReviewDate);

    await db.execute(
      `UPDATE vocabulary SET 
        repetition = ?, ease_factor = ?, interval_days = ?, next_review = ?
       WHERE id = ?`,
      [repetition, ease_factor, interval_days, nextReviewStr, req.params.id]
    );

    const [updatedRows] = await db.execute('SELECT * FROM vocabulary WHERE id = ?', [req.params.id]);
    res.json({ word: updatedRows[0] });
  } catch (error) {
    console.error('Error actualizando revisión:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/vocabulary/:id
router.put('/vocabulary/:id', async (req, res) => {
  try {
    const { word, translation, language, notes } = req.body;
    const db = getPool();
    const userId = req.user.id;

    await db.execute(
      'UPDATE vocabulary SET word = ?, translation = ?, language = ?, notes = ? WHERE id = ? AND user_id = ?',
      [word, translation, language || 'portugués', notes || '', req.params.id, userId]
    );

    const [updatedRows] = await db.execute('SELECT * FROM vocabulary WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (updatedRows.length === 0) {
      return res.status(404).json({ error: { message: 'Palabra no encontrada.' } });
    }
    res.json({ word: updatedRows[0] });
  } catch (error) {
    console.error('Error actualizando vocabulario:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/vocabulary/:id
router.delete('/vocabulary/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM vocabulary WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando vocabulario:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Mental Models ───────────────────────────────────────────────────────────

// GET /api/personal/mental-models
router.get('/mental-models', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [models] = await db.execute(
      'SELECT * FROM mental_models WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ models });
  } catch (error) {
    console.error('Error obteniendo mental models:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/mental-models
router.post('/mental-models', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { concept_name, content, book_title, author, category } = req.body;
    
    if (!concept_name || !content || !book_title) {
      return res.status(400).json({ error: { message: 'concept_name, content, y book_title son requeridos.' } });
    }

    const today = getUTC3DateString();

    const [result] = await db.execute(
      'INSERT INTO mental_models (user_id, concept_name, content, book_title, author, category, next_review) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, concept_name, content, book_title, author || null, category || null, today]
    );
    const [rows] = await db.execute('SELECT * FROM mental_models WHERE id = ?', [result.insertId]);
    res.status(201).json({ model: rows[0] });
  } catch (error) {
    console.error('Error creando mental model:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/mental-models/:id/review
router.put('/mental-models/:id/review', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { quality } = req.body; // 0=Again, 1=Hard, 2=Good, 3=Easy
    
    const [rows] = await db.execute('SELECT * FROM mental_models WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Modelo no encontrado.' } });
    
    const model = rows[0];
    let { repetition, ease_factor, interval_days } = model;

    ease_factor = ease_factor || 2.5;
    interval_days = interval_days || 0;

    // Algoritmo SM-2
    if (quality === 0) {
      repetition = 0;
      interval_days = 0;
    } else if (quality === 1) {
      if (repetition === 0) {
        interval_days = 0;
      } else {
        interval_days = Math.max(1, Math.round(interval_days * 1.2));
        repetition += 1;
      }
    } else if (quality === 2) {
      if (repetition === 0) {
        interval_days = 1;
      } else if (repetition === 1) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      repetition += 1;
    } else if (quality === 3) {
      if (repetition === 0) {
        interval_days = 4;
      } else if (repetition === 1) {
        interval_days = Math.round(6 * ease_factor);
      } else {
        interval_days = Math.round(interval_days * ease_factor * 1.3);
      }
      repetition += 1;
    }

    ease_factor = ease_factor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    if (ease_factor < 1.3) ease_factor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval_days);
    const nextReviewStr = getUTC3DateString(nextReviewDate);

    await db.execute(
      `UPDATE mental_models SET 
        repetition = ?, ease_factor = ?, interval_days = ?, next_review = ?
       WHERE id = ?`,
      [repetition, ease_factor, interval_days, nextReviewStr, req.params.id]
    );

    const [updatedRows] = await db.execute('SELECT * FROM mental_models WHERE id = ?', [req.params.id]);
    res.json({ model: updatedRows[0] });
  } catch (error) {
    console.error('Error actualizando revisión de mental model:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/mental-models/:id
router.put('/mental-models/:id', async (req, res) => {
  try {
    const { concept_name, content, book_title, author, category } = req.body;
    const db = getPool();
    const userId = req.user.id;

    await db.execute(
      `UPDATE mental_models SET 
        concept_name = COALESCE(?, concept_name), 
        content = COALESCE(?, content), 
        book_title = COALESCE(?, book_title), 
        author = COALESCE(?, author), 
        category = COALESCE(?, category) 
       WHERE id = ? AND user_id = ?`,
      [
        concept_name !== undefined ? concept_name : null, 
        content !== undefined ? content : null, 
        book_title !== undefined ? book_title : null, 
        author !== undefined ? author : null, 
        category !== undefined ? category : null, 
        req.params.id, 
        userId
      ]
    );

    const [updatedRows] = await db.execute('SELECT * FROM mental_models WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (updatedRows.length === 0) {
      return res.status(404).json({ error: { message: 'Modelo no encontrado.' } });
    }
    res.json({ model: updatedRows[0] });
  } catch (error) {
    console.error('Error actualizando mental model:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/mental-models/:id
router.delete('/mental-models/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM mental_models WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando mental model:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Journals ──────────────────────────────────────────────────────────────────

// GET /api/personal/journals
router.get('/journals', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [journals] = await db.execute(
      'SELECT id, date, content, created_at, updated_at FROM journals WHERE user_id = ? ORDER BY date DESC',
      [userId]
    );
    
    // Convertir dates a string YYYY-MM-DD para el frontend si no lo hace mysql2 por defecto
    const formattedJournals = journals.map(j => ({
      ...j,
      // Manejar el date en UTC para que mysql2 no reste el timezone y cambie el día
      date: typeof j.date === 'string' ? j.date.split('T')[0] : getUTC3DateString(j.date)
    }));

    res.json({ journals: formattedJournals });
  } catch (error) {
    console.error('Error obteniendo journals:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/journals
router.post('/journals', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { date, content } = req.body;
    
    if (!date) return res.status(400).json({ error: { message: 'date requerido.' } });

    // Verificar si ya existe
    const [existing] = await db.execute(
      'SELECT id FROM journals WHERE user_id = ? AND date = ?',
      [userId, date]
    );

    let journalId;
    if (existing.length > 0) {
      journalId = existing[0].id;
      await db.execute(
        'UPDATE journals SET content = ? WHERE id = ?',
        [content || '', journalId]
      );
    } else {
      const [result] = await db.execute(
        'INSERT INTO journals (user_id, date, content) VALUES (?, ?, ?)',
        [userId, date, content || '']
      );
      journalId = result.insertId;
    }
    
    const [rows] = await db.execute('SELECT * FROM journals WHERE id = ?', [journalId]);
    
    const journal = rows[0];
    journal.date = typeof journal.date === 'string' ? journal.date.split('T')[0] : getUTC3DateString(journal.date);

    res.status(existing.length > 0 ? 200 : 201).json({ journal });
  } catch (error) {
    console.error('Error creando journal:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/journals/:id
router.put('/journals/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { content } = req.body;

    await db.execute(
      'UPDATE journals SET content = ? WHERE id = ? AND user_id = ?',
      [content || '', req.params.id, userId]
    );

    const [rows] = await db.execute('SELECT * FROM journals WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: { message: 'Journal no encontrado.' } });
    
    const journal = rows[0];
    journal.date = typeof journal.date === 'string' ? journal.date.split('T')[0] : getUTC3DateString(journal.date);

    res.json({ journal });
  } catch (error) {
    console.error('Error actualizando journal:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Fitness ──────────────────────────────────────────────────────────────────

// GET /api/personal/fitness
router.get('/fitness', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    
    const [prs] = await db.execute(
      'SELECT id, exercise, record_value, record_date FROM personal_records WHERE user_id = ?',
      [userId]
    );

    const [workouts] = await db.execute(
      "SELECT id, date FROM workouts WHERE user_id = ? AND type = 'Fitness' AND date >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)",
      [userId]
    );
    
    res.json({ prs, weekly_workouts: workouts.length });
  } catch (error) {
    console.error('Error obteniendo fitness:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/fitness/workout
router.post('/fitness/workout', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const today = getUTC3DateString();
    
    const [existing] = await db.execute(
      "SELECT id FROM workouts WHERE user_id = ? AND type = 'Fitness' AND date = ?",
      [userId, today]
    );
    if (existing.length === 0) {
      await db.execute(
        "INSERT INTO workouts (user_id, type, date) VALUES (?, 'Fitness', ?)",
        [userId, today]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/fitness/pr
router.put('/fitness/pr', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { exercise, record_value } = req.body;
    
    if (!exercise || !record_value) {
      return res.status(400).json({ error: { message: 'exercise y record_value requeridos.' } });
    }
    
    const today = getUTC3DateString();
    
    await db.execute(
      `INSERT INTO personal_records (user_id, exercise, record_value, record_date) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE record_value = VALUES(record_value), record_date = VALUES(record_date)`,
      [userId, exercise, record_value, today]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating PR:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Focus Sessions ────────────────────────────────────────────────────────────

// GET /api/personal/focus-sessions
router.get('/focus-sessions', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [sessions] = await db.execute(
      'SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY session_date DESC',
      [userId]
    );
    res.json({ sessions });
  } catch (error) {
    console.error('Error obteniendo focus sessions:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/focus-sessions
router.post('/focus-sessions', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { description, duration, session_date } = req.body;
    if (!description || !duration || !session_date) {
      return res.status(400).json({ error: { message: 'description, duration y session_date son requeridos.' } });
    }

    const [result] = await db.execute(
      'INSERT INTO focus_sessions (user_id, description, duration, session_date) VALUES (?, ?, ?, ?)',
      [userId, description, duration, session_date]
    );
    const [rows] = await db.execute('SELECT * FROM focus_sessions WHERE id = ?', [result.insertId]);
    res.status(201).json({ session: rows[0] });
  } catch (error) {
    console.error('Error creando focus session:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/focus-sessions/:id
router.put('/focus-sessions/:id', async (req, res) => {
  try {
    const db = getPool();
    const { description, duration, session_date, status } = req.body;
    
    await db.execute(
      `UPDATE focus_sessions SET 
        description = COALESCE(?, description),
        duration = COALESCE(?, duration),
        session_date = COALESCE(?, session_date),
        status = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [
        description !== undefined ? description : null,
        duration !== undefined ? duration : null,
        session_date !== undefined ? session_date : null,
        status !== undefined ? status : null,
        req.params.id,
        req.user.id
      ]
    );
    
    const [rows] = await db.execute('SELECT * FROM focus_sessions WHERE id = ?', [req.params.id]);
    res.json({ session: rows[0] });
  } catch (error) {
    console.error('Error actualizando focus session:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/focus-sessions/:id
router.delete('/focus-sessions/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM focus_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando focus session:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// ─── Mediterranean Recipes ───────────────────────────────────────────────────

// GET /api/personal/mediterranean/recipes
router.get('/mediterranean/recipes', async (req, res) => {
  try {
    const db = getPool();
    const [recipes] = await db.execute(
      'SELECT * FROM med_recipes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ recipes });
  } catch (error) {
    console.error('Error obteniendo recetas:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// GET /api/personal/mediterranean/recipes/:id
router.get('/mediterranean/recipes/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const [recipes] = await db.execute(
      'SELECT * FROM med_recipes WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );
    if (recipes.length === 0) return res.status(404).json({ error: { message: 'Receta no encontrada.' } });
    const [history] = await db.execute(
      'SELECT * FROM med_cooking_history WHERE recipe_id = ? AND user_id = ? ORDER BY cooked_on DESC',
      [req.params.id, userId]
    );
    res.json({ recipe: recipes[0], history });
  } catch (error) {
    console.error('Error obteniendo receta:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/mediterranean/recipes
router.post('/mediterranean/recipes', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      name, origin_country, category, prep_time, cook_time, difficulty, cost, servings,
      calories, protein, carbs, fat, fiber,
      ingredients, steps, tips, health_tags, frequency, tags, learning, image_url
    } = req.body;
    if (!name) return res.status(400).json({ error: { message: 'name requerido.' } });

    const [result] = await db.execute(
      `INSERT INTO med_recipes
        (user_id, name, origin_country, category, prep_time, cook_time, difficulty, cost, servings,
         calories, protein, carbs, fat, fiber, ingredients, steps, tips, health_tags, frequency, tags, learning, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, name, origin_country || null, category || 'almuerzo',
        prep_time || null, cook_time || null, difficulty || 3, cost || '$$', servings || 2,
        calories || null, protein || null, carbs || null, fat || null, fiber || null,
        ingredients ? JSON.stringify(ingredients) : null,
        steps ? JSON.stringify(steps) : null,
        tips ? JSON.stringify(tips) : null,
        health_tags ? JSON.stringify(health_tags) : null,
        frequency || 'semanal',
        tags ? JSON.stringify(tags) : null,
        learning ? JSON.stringify(learning) : null,
        image_url || null
      ]
    );
    const [rows] = await db.execute('SELECT * FROM med_recipes WHERE id = ?', [result.insertId]);
    res.status(201).json({ recipe: rows[0] });
  } catch (error) {
    console.error('Error creando receta:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/mediterranean/recipes/:id
router.put('/mediterranean/recipes/:id', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const {
      name, origin_country, category, prep_time, cook_time, difficulty, cost, servings,
      calories, protein, carbs, fat, fiber,
      ingredients, steps, tips, health_tags, frequency, tags, learning, image_url, is_favorite
    } = req.body;

    await db.execute(
      `UPDATE med_recipes SET
        name = COALESCE(?, name),
        origin_country = COALESCE(?, origin_country),
        category = COALESCE(?, category),
        prep_time = COALESCE(?, prep_time),
        cook_time = COALESCE(?, cook_time),
        difficulty = COALESCE(?, difficulty),
        cost = COALESCE(?, cost),
        servings = COALESCE(?, servings),
        calories = COALESCE(?, calories),
        protein = COALESCE(?, protein),
        carbs = COALESCE(?, carbs),
        fat = COALESCE(?, fat),
        fiber = COALESCE(?, fiber),
        ingredients = COALESCE(?, ingredients),
        steps = COALESCE(?, steps),
        tips = COALESCE(?, tips),
        health_tags = COALESCE(?, health_tags),
        frequency = COALESCE(?, frequency),
        tags = COALESCE(?, tags),
        learning = COALESCE(?, learning),
        image_url = COALESCE(?, image_url),
        is_favorite = COALESCE(?, is_favorite)
       WHERE id = ? AND user_id = ?`,
      [
        name !== undefined ? name : null,
        origin_country !== undefined ? origin_country : null,
        category !== undefined ? category : null,
        prep_time !== undefined ? prep_time : null,
        cook_time !== undefined ? cook_time : null,
        difficulty !== undefined ? difficulty : null,
        cost !== undefined ? cost : null,
        servings !== undefined ? servings : null,
        calories !== undefined ? calories : null,
        protein !== undefined ? protein : null,
        carbs !== undefined ? carbs : null,
        fat !== undefined ? fat : null,
        fiber !== undefined ? fiber : null,
        ingredients !== undefined ? JSON.stringify(ingredients) : null,
        steps !== undefined ? JSON.stringify(steps) : null,
        tips !== undefined ? JSON.stringify(tips) : null,
        health_tags !== undefined ? JSON.stringify(health_tags) : null,
        frequency !== undefined ? frequency : null,
        tags !== undefined ? JSON.stringify(tags) : null,
        learning !== undefined ? JSON.stringify(learning) : null,
        image_url !== undefined ? image_url : null,
        is_favorite !== undefined ? (is_favorite ? 1 : 0) : null,
        req.params.id, userId
      ]
    );
    const [rows] = await db.execute('SELECT * FROM med_recipes WHERE id = ?', [req.params.id]);
    res.json({ recipe: rows[0] });
  } catch (error) {
    console.error('Error actualizando receta:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/mediterranean/recipes/:id
router.delete('/mediterranean/recipes/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM med_recipes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando receta:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/mediterranean/history
router.post('/mediterranean/history', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { recipe_id, rating, notes, would_change, cooked_on } = req.body;
    if (!recipe_id) return res.status(400).json({ error: { message: 'recipe_id requerido.' } });

    const today = cooked_on || getUTC3DateString();
    const [result] = await db.execute(
      'INSERT INTO med_cooking_history (user_id, recipe_id, cooked_on, rating, notes, would_change) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, recipe_id, today, rating || null, notes || null, would_change || null]
    );
    const [rows] = await db.execute('SELECT * FROM med_cooking_history WHERE id = ?', [result.insertId]);
    res.status(201).json({ entry: rows[0] });
  } catch (error) {
    console.error('Error agregando historial:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// GET /api/personal/mediterranean/stats
router.get('/mediterranean/stats', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;

    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM med_recipes WHERE user_id = ?', [userId]
    );
    const [[{ favorites }]] = await db.execute(
      'SELECT COUNT(*) as favorites FROM med_recipes WHERE user_id = ? AND is_favorite = 1', [userId]
    );
    const [[{ this_month }]] = await db.execute(
      `SELECT COUNT(*) as this_month FROM med_cooking_history
       WHERE user_id = ? AND MONTH(cooked_on) = MONTH(CURDATE()) AND YEAR(cooked_on) = YEAR(CURDATE())`,
      [userId]
    );
    const [[{ total_cooked }]] = await db.execute(
      'SELECT COUNT(*) as total_cooked FROM med_cooking_history WHERE user_id = ?', [userId]
    );
    const [categories] = await db.execute(
      `SELECT r.category, COUNT(h.id) as count
       FROM med_cooking_history h
       JOIN med_recipes r ON h.recipe_id = r.id
       WHERE h.user_id = ?
       GROUP BY r.category ORDER BY count DESC`,
      [userId]
    );
    const [topRecipes] = await db.execute(
      `SELECT r.id, r.name, r.image_url, COUNT(h.id) as times_cooked, AVG(h.rating) as avg_rating
       FROM med_cooking_history h
       JOIN med_recipes r ON h.recipe_id = r.id
       WHERE h.user_id = ?
       GROUP BY r.id, r.name, r.image_url
       ORDER BY times_cooked DESC LIMIT 5`,
      [userId]
    );
    const [[{ avg_time }]] = await db.execute(
      `SELECT AVG(COALESCE(prep_time, 0) + COALESCE(cook_time, 0)) as avg_time
       FROM med_recipes WHERE user_id = ?`,
      [userId]
    );

    res.json({ total, favorites, this_month, total_cooked, categories, top_recipes: topRecipes, avg_time: Math.round(avg_time || 0) });
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// GET /api/personal/mediterranean/shopping
router.get('/mediterranean/shopping', async (req, res) => {
  try {
    const db = getPool();
    const [items] = await db.execute(
      'SELECT * FROM med_shopping_list WHERE user_id = ? ORDER BY category, created_at ASC',
      [req.user.id]
    );
    res.json({ items });
  } catch (error) {
    console.error('Error obteniendo lista:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// POST /api/personal/mediterranean/shopping
router.post('/mediterranean/shopping', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: { message: 'items requeridos.' } });
    }
    const inserted = [];
    for (const item of items) {
      const { name, qty, unit, category, recipe_id } = item;
      if (!name) continue;
      const [result] = await db.execute(
        'INSERT INTO med_shopping_list (user_id, name, qty, unit, category, recipe_id) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, qty || null, unit || null, category || 'otros', recipe_id || null]
      );
      const [rows] = await db.execute('SELECT * FROM med_shopping_list WHERE id = ?', [result.insertId]);
      inserted.push(rows[0]);
    }
    res.status(201).json({ items: inserted });
  } catch (error) {
    console.error('Error agregando items:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/mediterranean/shopping/:id
router.put('/mediterranean/shopping/:id', async (req, res) => {
  try {
    const db = getPool();
    const { checked, name, qty, unit, category } = req.body;
    await db.execute(
      `UPDATE med_shopping_list SET
        checked = COALESCE(?, checked),
        name = COALESCE(?, name),
        qty = COALESCE(?, qty),
        unit = COALESCE(?, unit),
        category = COALESCE(?, category)
       WHERE id = ? AND user_id = ?`,
      [
        checked !== undefined ? (checked ? 1 : 0) : null,
        name !== undefined ? name : null,
        qty !== undefined ? qty : null,
        unit !== undefined ? unit : null,
        category !== undefined ? category : null,
        req.params.id, req.user.id
      ]
    );
    const [rows] = await db.execute('SELECT * FROM med_shopping_list WHERE id = ?', [req.params.id]);
    res.json({ item: rows[0] });
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/mediterranean/shopping/clear  (must be before /:id)
router.delete('/mediterranean/shopping/clear', async (req, res) => {
  try {
    const db = getPool();
    const { onlyChecked } = req.query;
    if (onlyChecked === 'true') {
      await db.execute('DELETE FROM med_shopping_list WHERE user_id = ? AND checked = 1', [req.user.id]);
    } else {
      await db.execute('DELETE FROM med_shopping_list WHERE user_id = ?', [req.user.id]);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error limpiando lista:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// DELETE /api/personal/mediterranean/shopping/:id
router.delete('/mediterranean/shopping/:id', async (req, res) => {
  try {
    const db = getPool();
    await db.execute('DELETE FROM med_shopping_list WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando item:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// Helper: obtener lunes de la semana actual (UTC-3)
function getCurrentWeekStart() {
  const tzOffset = 3 * 60 * 60 * 1000;
  const localNow = new Date(Date.now() - tzOffset);
  const dayOfWeek = localNow.getDay(); // 0=Dom
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  localNow.setDate(localNow.getDate() - daysToMonday);
  return localNow.toISOString().split('T')[0];
}

// GET /api/personal/mediterranean/weekly-goals
router.get('/mediterranean/weekly-goals', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const weekStart = getCurrentWeekStart();

    const [rows] = await db.execute(
      'SELECT * FROM med_weekly_goals WHERE user_id = ? AND week_start = ?',
      [userId, weekStart]
    );
    if (rows.length === 0) {
      await db.execute('INSERT INTO med_weekly_goals (user_id, week_start) VALUES (?, ?)', [userId, weekStart]);
      const [newRows] = await db.execute(
        'SELECT * FROM med_weekly_goals WHERE user_id = ? AND week_start = ?', [userId, weekStart]
      );
      return res.json({ goals: newRows[0] });
    }
    res.json({ goals: rows[0] });
  } catch (error) {
    console.error('Error obteniendo objetivos semanales:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

// PUT /api/personal/mediterranean/weekly-goals
router.put('/mediterranean/weekly-goals', async (req, res) => {
  try {
    const db = getPool();
    const userId = req.user.id;
    const { fish_count, legumes_count, fruit_days, veggie_days } = req.body;
    const weekStart = getCurrentWeekStart();

    await db.execute(
      `INSERT INTO med_weekly_goals (user_id, week_start, fish_count, legumes_count, fruit_days, veggie_days)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         fish_count    = COALESCE(VALUES(fish_count), fish_count),
         legumes_count = COALESCE(VALUES(legumes_count), legumes_count),
         fruit_days    = COALESCE(VALUES(fruit_days), fruit_days),
         veggie_days   = COALESCE(VALUES(veggie_days), veggie_days)`,
      [
        userId, weekStart,
        fish_count !== undefined ? fish_count : null,
        legumes_count !== undefined ? legumes_count : null,
        fruit_days !== undefined ? JSON.stringify(fruit_days) : null,
        veggie_days !== undefined ? JSON.stringify(veggie_days) : null
      ]
    );
    const [rows] = await db.execute(
      'SELECT * FROM med_weekly_goals WHERE user_id = ? AND week_start = ?', [userId, weekStart]
    );
    res.json({ goals: rows[0] });
  } catch (error) {
    console.error('Error actualizando objetivos semanales:', error);
    res.status(500).json({ error: { message: 'Error interno del servidor.' } });
  }
});

module.exports = router;


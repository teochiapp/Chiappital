const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Obtener todas las métricas históricas de una cuenta
router.get('/', async (req, res) => {
  try {
    const { account_type = 'propia' } = req.query;
    const userId = req.user.id;
    const db = getPool();

    const [rows] = await db.execute(
      `SELECT * FROM historical_metrics 
       WHERE user_id = ? AND account_type = ? 
       ORDER BY id ASC`,
      [userId, account_type]
    );

    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching historical metrics:', error);
    res.status(500).json({ error: { message: 'Error fetching metrics' } });
  }
});

// Actualizar una métrica histórica
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { usd_start, deposits, usd_end, var_percent, var_spy, difference } = req.body;
    const db = getPool();

    // Verify ownership and get month_year
    const [existing] = await db.execute(
      'SELECT id, month_year FROM historical_metrics WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: { message: 'Metric not found or unauthorized' } });
    }

    const monthYear = existing[0].month_year;

    await db.execute(
      `UPDATE historical_metrics 
       SET usd_start = ?, deposits = ?, usd_end = ?, var_percent = ?, var_spy = ?, difference = ?
       WHERE id = ? AND user_id = ?`,
      [
        usd_start || 0, 
        deposits || 0, 
        usd_end || 0, 
        var_percent || 0, 
        var_spy || 0, 
        difference || 0, 
        id, 
        userId
      ]
    );

    // Update var_spy for the other account type for the same month
    await db.execute(
      `UPDATE historical_metrics 
       SET var_spy = ?, difference = var_percent - ?
       WHERE user_id = ? AND month_year = ? AND id != ?`,
      [var_spy || 0, var_spy || 0, userId, monthYear, id]
    );

    res.json({ message: 'Metric updated successfully' });
  } catch (error) {
    console.error('Error updating historical metric:', error);
    res.status(500).json({ error: { message: 'Error updating metric' } });
  }
});

// Crear una nueva métrica histórica (mes vacío)
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { month_year, account_type = 'propia' } = req.body;
    
    if (!month_year) {
      return res.status(400).json({ error: { message: 'month_year is required' } });
    }

    const db = getPool();
    
    // Check if it already exists
    const [existing] = await db.execute(
      'SELECT id FROM historical_metrics WHERE user_id = ? AND account_type = ? AND month_year = ?',
      [userId, account_type, month_year]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: { message: 'El mes ya existe en esta cuenta.' } });
    }

    // Check if there is an existing month in the other account to copy var_spy
    const [otherAcc] = await db.execute(
      'SELECT var_spy FROM historical_metrics WHERE user_id = ? AND month_year = ?',
      [userId, month_year]
    );
    
    const initialVarSpy = otherAcc.length > 0 ? otherAcc[0].var_spy : 0;
    const initialDifference = 0 - initialVarSpy; // var_percent is 0

    const [result] = await db.execute(
      `INSERT INTO historical_metrics 
       (user_id, account_type, month_year, usd_start, deposits, usd_end, var_percent, var_spy, difference)
       VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?)`,
      [userId, account_type, month_year, initialVarSpy, initialDifference]
    );

    const [newRow] = await db.execute('SELECT * FROM historical_metrics WHERE id = ?', [result.insertId]);
    
    res.json({ data: newRow[0], message: 'Mes agregado correctamente' });
  } catch (error) {
    console.error('Error creating historical metric:', error);
    res.status(500).json({ error: { message: 'Error creating metric' } });
  }
});

module.exports = router;

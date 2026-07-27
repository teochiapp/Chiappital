const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');

// POST /api/alerts - Create a new alert
router.post('/', authenticate, async (req, res) => {
  const { symbol, target_price, condition_type, notes } = req.body;
  const user_id = req.user.id;

  if (!symbol || !target_price || !condition_type) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (symbol, target_price, condition_type)' });
  }

  try {
    const db = getPool();
    const [result] = await db.execute(
      `INSERT INTO market_alerts (user_id, symbol, target_price, condition_type, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, symbol.toUpperCase(), target_price, condition_type, notes || null]
    );

    res.status(201).json({
      message: 'Alerta creada con éxito',
      id: result.insertId,
      symbol: symbol.toUpperCase(),
      target_price,
      condition_type,
      is_active: 1
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Error interno al crear la alerta' });
  }
});

// GET /api/alerts - Get all alerts for the user
router.get('/', authenticate, async (req, res) => {
  const user_id = req.user.id;
  try {
    const db = getPool();
    const [rows] = await db.execute(
      `SELECT * FROM market_alerts WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Error interno al obtener las alertas' });
  }
});

// PUT /api/alerts/:id - Update an alert
router.put('/:id', authenticate, async (req, res) => {
  const user_id = req.user.id;
  const alertId = req.params.id;
  const { symbol, target_price, condition_type, is_active, notes } = req.body;

  try {
    const db = getPool();
    
    // Validate ownership
    const [existing] = await db.execute('SELECT id FROM market_alerts WHERE id = ? AND user_id = ?', [alertId, user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada o no tienes permisos' });
    }

    await db.execute(
      `UPDATE market_alerts 
       SET symbol = COALESCE(?, symbol),
           target_price = COALESCE(?, target_price),
           condition_type = COALESCE(?, condition_type),
           is_active = COALESCE(?, is_active),
           notes = COALESCE(?, notes)
       WHERE id = ? AND user_id = ?`,
      [symbol ? symbol.toUpperCase() : null, target_price, condition_type, is_active !== undefined ? (is_active ? 1 : 0) : null, notes, alertId, user_id]
    );

    res.json({ message: 'Alerta actualizada correctamente' });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Error interno al actualizar la alerta' });
  }
});

// DELETE /api/alerts/:id - Delete an alert
router.delete('/:id', authenticate, async (req, res) => {
  const user_id = req.user.id;
  const alertId = req.params.id;

  try {
    const db = getPool();
    const [result] = await db.execute('DELETE FROM market_alerts WHERE id = ? AND user_id = ?', [alertId, user_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Error interno al eliminar la alerta' });
  }
});

// PUT /api/alerts/:id/deactivate - Convenience endpoint to deactivate triggered alerts
router.put('/:id/deactivate', authenticate, async (req, res) => {
  const user_id = req.user.id;
  const alertId = req.params.id;
  
  try {
    const db = getPool();
    const [result] = await db.execute(
      'UPDATE market_alerts SET is_active = 0 WHERE id = ? AND user_id = ?', 
      [alertId, user_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    res.json({ message: 'Alerta desactivada' });
  } catch (error) {
    console.error('Error deactivating alert:', error);
    res.status(500).json({ error: 'Error al desactivar la alerta' });
  }
});

module.exports = router;

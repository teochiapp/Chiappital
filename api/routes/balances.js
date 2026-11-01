const express = require('express');
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// ─── GET /api/balances ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const accountType = req.query.account_type || 'propia';

    if (!['propia', 'compartida'].includes(accountType)) {
      return res.status(400).json({ error: { message: 'account_type debe ser propia o compartida.' } });
    }

    const db = getPool();
    const [rows] = await db.execute(
      'SELECT total_usd FROM portfolio_balances WHERE user_id = ? AND account_type = ?',
      [req.user.id, accountType]
    );

    const totalUsd = rows.length > 0 ? parseFloat(rows[0].total_usd) : 0;

    return res.json({ data: { total_usd: totalUsd } });
  } catch (error) {
    console.error('Error en GET /balances:', error);
    return res.status(500).json({ error: { message: 'Error al obtener balances.' } });
  }
});

// ─── PUT /api/balances ─────────────────────────────────────────────────────────
router.put('/', async (req, res) => {
  try {
    const { account_type, total_usd } = req.body;
    
    if (!account_type || !['propia', 'compartida'].includes(account_type)) {
      return res.status(400).json({ error: { message: 'account_type debe ser propia o compartida.' } });
    }

    if (total_usd === undefined || isNaN(parseFloat(total_usd))) {
      return res.status(400).json({ error: { message: 'total_usd es requerido y debe ser un número.' } });
    }

    const db = getPool();
    
    // Insert on duplicate key update
    await db.execute(
      `INSERT INTO portfolio_balances (user_id, account_type, total_usd)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE total_usd = ?`,
      [req.user.id, account_type, parseFloat(total_usd), parseFloat(total_usd)]
    );

    console.log(`✅ Balance actualizado para user ${req.user.id} (${account_type}): $${total_usd}`);

    return res.json({ data: { total_usd: parseFloat(total_usd) } });
  } catch (error) {
    console.error('Error en PUT /balances:', error);
    return res.status(500).json({ error: { message: 'Error al actualizar balance.' } });
  }
});

// ─── GET /api/balances/drawdown ─────────────────────────────────────────────────────────
router.get('/drawdown', async (req, res) => {
  try {
    const accountType = req.query.account_type || 'propia';
    
    if (!['propia', 'compartida'].includes(accountType)) {
      return res.status(400).json({ error: { message: 'account_type debe ser propia o compartida.' } });
    }

    const db = getPool();
    
    // 1. Obtener balance actual
    let currentCapital = req.query.current_capital ? parseFloat(req.query.current_capital) : null;
    
    if (currentCapital === null || isNaN(currentCapital)) {
      const [balRows] = await db.execute(
        'SELECT total_usd FROM portfolio_balances WHERE user_id = ? AND account_type = ?',
        [req.user.id, accountType]
      );
      currentCapital = balRows.length > 0 ? parseFloat(balRows[0].total_usd) : 0;
    }

    // 2. Obtener máximo histórico de snapshots
    const [snapRows] = await db.execute(
      'SELECT MAX(total_usd) as max_usd FROM portfolio_snapshots WHERE user_id = ? AND account_type = ?',
      [req.user.id, accountType]
    );
    const maxSnapshot = snapRows.length > 0 && snapRows[0].max_usd !== null ? parseFloat(snapRows[0].max_usd) : 0;

    // 3. El maximo historico es el mayor entre el actual y los snapshots
    const ath = Math.max(currentCapital, maxSnapshot);

    // 4. Calcular drawdown
    let drawdown = 0;
    if (ath > 0 && currentCapital < ath) {
      drawdown = ((currentCapital - ath) / ath) * 100;
    }

    return res.json({ 
      data: { 
        current_capital: currentCapital,
        ath: ath,
        drawdown: drawdown,
        is_ath: currentCapital >= ath
      } 
    });
  } catch (error) {
    console.error('Error en GET /balances/drawdown:', error);
    return res.status(500).json({ error: { message: 'Error al obtener drawdown.' } });
  }
});

// ─── PUT /api/balances/ath ─────────────────────────────────────────────────────────
router.put('/ath', async (req, res) => {
  try {
    const accountType = req.body.account_type || 'propia';
    const ath = parseFloat(req.body.ath);

    if (!['propia', 'compartida'].includes(accountType)) {
      return res.status(400).json({ error: { message: 'account_type debe ser propia o compartida.' } });
    }

    if (isNaN(ath) || ath < 0) {
      return res.status(400).json({ error: { message: 'ath debe ser un número válido mayor o igual a 0.' } });
    }

    const db = getPool();

    // 1. Obtener snapshots existentes ordenados por total_usd DESC
    const [existing] = await db.execute(
      'SELECT id, total_usd FROM portfolio_snapshots WHERE user_id = ? AND account_type = ? ORDER BY total_usd DESC',
      [req.user.id, accountType]
    );

    if (existing.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      await db.execute(
        'INSERT INTO portfolio_snapshots (user_id, account_type, total_usd, snapshot_date) VALUES (?, ?, ?, ?)',
        [req.user.id, accountType, ath, today]
      );
    } else {
      // Actualizar el snapshot más alto al nuevo ATH
      const topSnapshot = existing[0];
      await db.execute(
        'UPDATE portfolio_snapshots SET total_usd = ? WHERE id = ?',
        [ath, topSnapshot.id]
      );

      // Si hubiese algún otro snapshot mayor al nuevo ATH, ajustarlo para que el máximo no lo supere
      await db.execute(
        'UPDATE portfolio_snapshots SET total_usd = ? WHERE user_id = ? AND account_type = ? AND total_usd > ?',
        [ath, req.user.id, accountType, ath]
      );
    }

    console.log(`✅ ATH actualizado para user ${req.user.id} (${accountType}): $${ath}`);

    return res.json({
      data: {
        account_type: accountType,
        ath: ath
      }
    });
  } catch (error) {
    console.error('Error en PUT /balances/ath:', error);
    return res.status(500).json({ error: { message: 'Error al actualizar ATH.' } });
  }
});

module.exports = router;


// routes/trades.js - CRUD de trades protegido con JWT
const express = require('express');
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de trades requieren autenticación
router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mapea una fila de MySQL al formato que espera el frontend.
 * El frontend espera acceso directo a los atributos (no anidados en .attributes).
 */
function formatTrade(row) {
  return {
    id: row.id,
    account_type: row.account_type || 'propia',
    symbol: row.symbol,
    type: row.type,
    entry_price: parseFloat(row.entry_price),
    entry_price_ars: row.entry_price_ars !== null ? parseFloat(row.entry_price_ars) : null,
    exit_price: row.exit_price !== null ? parseFloat(row.exit_price) : null,
    portfolio_percentage: row.portfolio_percentage !== null ? parseFloat(row.portfolio_percentage) : null,
    stop_loss: row.stop_loss !== null ? parseFloat(row.stop_loss) : null,
    take_profit: row.take_profit !== null ? parseFloat(row.take_profit) : null,
    strategy: row.strategy || null,
    emotions: row.emotions || null,
    notes: row.notes || null,
    custom_country: row.custom_country || null,
    custom_sector: row.custom_sector || null,
    status: row.status,
    result: row.result !== null ? parseFloat(row.result) : null,
    closed_at: row.closed_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── GET /api/trades ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const accountType = req.query.account_type || 'propia';
    
    if (!['propia', 'compartida'].includes(accountType)) {
      return res.status(400).json({ error: { message: 'account_type debe ser propia o compartida.' } });
    }

    const db = getPool();
    const [rows] = await db.execute(
      'SELECT * FROM trades WHERE user_id = ? AND account_type = ? ORDER BY created_at DESC',
      [req.user.id, accountType]
    );

    return res.json({ data: rows.map(formatTrade) });
  } catch (error) {
    console.error('Error en GET /trades:', error);
    return res.status(500).json({ error: { message: 'Error al obtener trades.' } });
  }
});

// ─── POST /api/trades ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { data } = req.body;
    const tradeData = data || req.body;

    const {
      symbol, type, account_type = 'propia', entry_price, entry_price_ars = null,
      exit_price = null, portfolio_percentage = null,
      stop_loss = null, take_profit = null,
      strategy = null, emotions = null, notes = null,
      custom_country = null, custom_sector = null,
      status = 'open', result = null, closed_at = null,
    } = tradeData;

    // Validaciones básicas
    if (!symbol || !type || entry_price === undefined || entry_price === null || entry_price === '') {
      return res.status(400).json({
        error: { message: 'symbol, type y entry_price son requeridos.' }
      });
    }

    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({ error: { message: 'type debe ser "buy" o "sell".' } });
    }
    
    if (!['propia', 'compartida'].includes(account_type)) {
      return res.status(400).json({ error: { message: 'account_type debe ser "propia" o "compartida".' } });
    }

    const db = getPool();
    const [insertResult] = await db.execute(
      `INSERT INTO trades
        (user_id, account_type, symbol, type, entry_price, entry_price_ars, exit_price, portfolio_percentage,
         stop_loss, take_profit, strategy, emotions, notes, custom_country, custom_sector, status, result, closed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, account_type, symbol, type, entry_price, entry_price_ars, exit_price, portfolio_percentage,
        stop_loss, take_profit, strategy, emotions, notes, custom_country, custom_sector, status, result, closed_at
      ]
    );

    // Retornar el trade creado
    const [rows] = await db.execute(
      'SELECT * FROM trades WHERE id = ?',
      [insertResult.insertId]
    );

    console.log(`✅ Trade creado: ${symbol} ${type} por user ${req.user.id}`);
    return res.status(201).json({ data: formatTrade(rows[0]) });
  } catch (error) {
    console.error('Error en POST /trades:', error);
    return res.status(500).json({ error: { message: 'Error al crear trade.' } });
  }
});

// ─── PUT /api/trades/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id, 10);
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: { message: 'ID de trade inválido.' } });
    }

    const db = getPool();

    // Verificar que el trade pertenece al usuario autenticado
    const [existingRows] = await db.execute(
      'SELECT id, user_id FROM trades WHERE id = ?',
      [tradeId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: { message: 'Trade no encontrado.' } });
    }

    if (existingRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'No tenés permiso para modificar este trade.' } });
    }

    // Extraer datos (Strapi los envía en { data: {...} })
    const { data } = req.body;
    const updateData = data || req.body;

    // Construir SET dinámico solo con los campos que vienen
    const allowedFields = [
      'account_type', 'symbol', 'type', 'entry_price', 'exit_price', 'portfolio_percentage',
      'stop_loss', 'take_profit', 'strategy', 'emotions', 'notes', 'custom_country', 'custom_sector',
      'status', 'result', 'closed_at'
    ];

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        setClauses.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: { message: 'No hay campos para actualizar.' } });
    }

    values.push(tradeId);
    await db.execute(
      `UPDATE trades SET ${setClauses.join(', ')} WHERE id = ?`,
      values
    );

    // Retornar el trade actualizado
    const [rows] = await db.execute('SELECT * FROM trades WHERE id = ?', [tradeId]);
    console.log(`✅ Trade ${tradeId} actualizado por user ${req.user.id}`);
    return res.json({ data: formatTrade(rows[0]) });
  } catch (error) {
    console.error('Error en PUT /trades/:id:', error);
    return res.status(500).json({ error: { message: 'Error al actualizar trade.' } });
  }
});

// ─── DELETE /api/trades/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const tradeId = parseInt(req.params.id, 10);
    if (isNaN(tradeId)) {
      return res.status(400).json({ error: { message: 'ID de trade inválido.' } });
    }

    const db = getPool();

    // Verificar ownership
    const [existingRows] = await db.execute(
      'SELECT id, user_id FROM trades WHERE id = ?',
      [tradeId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: { message: 'Trade no encontrado.' } });
    }

    if (existingRows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: { message: 'No tenés permiso para eliminar este trade.' } });
    }

    await db.execute('DELETE FROM trades WHERE id = ?', [tradeId]);

    console.log(`✅ Trade ${tradeId} eliminado por user ${req.user.id}`);
    return res.json({ message: 'Trade eliminado correctamente.' });
  } catch (error) {
    console.error('Error en DELETE /trades/:id:', error);
    return res.status(500).json({ error: { message: 'Error al eliminar trade.' } });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

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

// Enviar resumen por correo
router.post('/send-summary', async (req, res) => {
  try {
    const { recipient, customMessage, monthData, ytdData } = req.body;

    if (!recipient) {
      return res.status(400).json({ error: { message: 'Se requiere al menos un destinatario' } });
    }

    const formatCurrency = (val) => `$${parseFloat(val).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    const formatPercent = (val) => `${parseFloat(val).toFixed(2)}%`;

    const profit = parseFloat(monthData.usd_end) - parseFloat(monthData.usd_start);
    const profitColor = profit >= 0 ? '#10b981' : '#ef4444';
    const diffColor = parseFloat(monthData.difference) >= 0 ? '#10b981' : '#ef4444';

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', -apple-system, sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo-container { margin-bottom: 16px; display: inline-block; }
        .logo-img { width: 40px; height: 40px; vertical-align: middle; margin-right: 12px; }
        .logo-text { color: #f8fafc; font-size: 24px; font-weight: 800; vertical-align: middle; }
        .header-title { margin: 0; font-size: 16px; font-weight: 500; color: #94a3b8; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .message { font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px; white-space: pre-wrap; }
        .stats-box { margin-top: 24px; padding: 16px; background-color: #1e293b; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .stats-title { margin-top: 0; margin-bottom: 12px; font-size: 14px; color: #94a3b8; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
        .td-label { color: #cbd5e1; }
        .td-value { color: #f8fafc; text-align: right; font-weight: 600; }
        .footer { text-align: center; padding: 24px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="logo-container">
              <img src="https://chiappital.surcodes.com/logo-simple-trade.png" alt="Logo" class="logo-img" />
              <span class="logo-text"><span style="color: #fbbf24;">CHIAPP</span>ITAL</span>
            </div>
            <h1 class="header-title">Resumen Mensual: ${monthData.month_year}</h1>
          </div>
          <div class="content">
            ${customMessage ? `<div class="message">${customMessage}</div>` : ''}
            
            <div class="stats-box">
              <h3 class="stats-title">Rendimiento del Mes</h3>
              <table>
                <tr><td class="td-label">Capital Inicial</td><td class="td-value">${formatCurrency(monthData.usd_start)}</td></tr>
                <tr><td class="td-label">Aportes</td><td class="td-value">${formatCurrency(monthData.deposits)}</td></tr>
                <tr><td class="td-label">Capital Final</td><td class="td-value">${formatCurrency(monthData.usd_end)}</td></tr>
                <tr><td class="td-label">Ganancia (USD)</td><td class="td-value" style="color: ${profitColor}">${profit > 0 ? '+' : ''}${formatCurrency(profit)}</td></tr>
                <tr><td class="td-label">Variación Cartera</td><td class="td-value" style="color: ${parseFloat(monthData.var_percent) >= 0 ? '#10b981' : '#ef4444'}">${formatPercent(monthData.var_percent)}</td></tr>
                <tr><td class="td-label">Variación SPY</td><td class="td-value">${formatPercent(monthData.var_spy)}</td></tr>
                <tr><td class="td-label">Diferencia vs SPY</td><td class="td-value" style="color: ${diffColor}">${formatPercent(monthData.difference)}</td></tr>
              </table>
            </div>

            ${ytdData ? `
            <div class="stats-box" style="margin-top: 16px;">
              <h3 class="stats-title">Resumen Anual (YTD)</h3>
              <table>
                <tr><td class="td-label">YTD Cartera</td><td class="td-value" style="color: ${ytdData.ytd >= 0 ? '#10b981' : '#ef4444'}">${formatPercent(ytdData.ytd)}</td></tr>
                <tr><td class="td-label">Ganancia YTD (USD)</td><td class="td-value" style="color: ${ytdData.profit >= 0 ? '#10b981' : '#ef4444'}">${ytdData.profit > 0 ? '+' : ''}${formatCurrency(ytdData.profit)}</td></tr>
                <tr><td class="td-label">YTD SPY</td><td class="td-value">${formatPercent(ytdData.spy)}</td></tr>
                <tr><td class="td-label">Diferencia YTD</td><td class="td-value" style="color: ${ytdData.diff >= 0 ? '#10b981' : '#ef4444'}">${formatPercent(ytdData.diff)}</td></tr>
              </table>
            </div>
            ` : ''}
          </div>
        </div>
        <div class="footer">
          Generado desde Chiappital Dashboard.<br>
          © ${new Date().getFullYear()} Chiappital.
        </div>
      </div>
    </body>
    </html>
    `;

    const emailResult = await sendEmail({
      to: recipient,
      subject: `Resumen Mensual: ${monthData.month_year} - Chiappital`,
      text: customMessage || `Adjunto el resumen mensual de ${monthData.month_year}`,
      html: html
    });

    if (emailResult) {
      res.json({ message: 'Correo enviado correctamente' });
    } else {
      res.status(500).json({ error: { message: 'No se pudo enviar el correo' } });
    }
  } catch (error) {
    console.error('Error sending historical summary:', error);
    res.status(500).json({ error: { message: 'Error interno al enviar resumen' } });
  }
});

module.exports = router;

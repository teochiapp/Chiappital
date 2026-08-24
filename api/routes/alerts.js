const express = require('express');
const router = express.Router();
const { getPool } = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'alert-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Función auxiliar para reemplazar las variables y generar el HTML
function formatEmailContent(alert, triggerData) {
  let text = alert.email_template || '';
  text = text.replace(/{symbol}/g, alert.symbol);
  text = text.replace(/{triggerTime}/g, triggerData.triggerTime || new Date().toLocaleString());
  
  if (triggerData.price) {
    text = text.replace(/{price}/g, `$${triggerData.price}`);
  }
  
  // Procesar includes
  let includes = {};
  try {
    if (alert.email_includes) {
      includes = typeof alert.email_includes === 'string' ? JSON.parse(alert.email_includes) : alert.email_includes;
    }
  } catch(e) {
    console.error('Error parseando email_includes:', e);
  }
  
  // Construir versión texto plano
  let textStats = '\n\n────────────────────────────────\n';
  if (includes.price && triggerData.price) textStats += `Precio actual: $${triggerData.price}\n`;
  if (includes.ema21 && triggerData.ema21) textStats += `Distancia EMA 21: ${triggerData.ema21}%\n`;
  if (includes.drawdown && triggerData.drawdown) textStats += `Drawdown 52w: ${triggerData.drawdown}%\n`;
  if (includes.rsi && triggerData.rsi) textStats += `RSI Semanal: ${triggerData.rsi}\n`;
  if (includes.macd && triggerData.macd) textStats += `MACD Hist: ${triggerData.macd}\n`;
  if (includes.opScore && triggerData.opScore) textStats += `OP Score: ${triggerData.opScore}/100\n`;
  
  const finalText = Object.keys(includes).length > 0 ? text + textStats : text;

  // Construir versión HTML
  let formattedText = text;
  // Soportar imágenes tipo markdown: ![alt](url)
  formattedText = formattedText.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 16px 0; display: block;" />');
  // Reemplazar saltos de línea por <br/>
  formattedText = formattedText.replace(/\n/g, '<br/>');
  
  let htmlStats = '';
  if (Object.keys(includes).length > 0) {
    htmlStats = `
      <div style="margin-top: 24px; padding: 16px; background-color: #1e293b; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Métricas Técnicas</h3>
        <table style="width: 100%; border-collapse: collapse;">
    `;
    
    const addStatRow = (label, value) => {
      htmlStats += `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #cbd5e1; font-size: 14px;">${label}</td>
          <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #f8fafc; font-size: 14px; text-align: right; font-weight: 600;">${value}</td>
        </tr>
      `;
    };

    if (includes.price && triggerData.price) addStatRow('Precio actual', `$${triggerData.price}`);
    if (includes.ema21 && triggerData.ema21) addStatRow('Distancia EMA 21', `${triggerData.ema21}%`);
    if (includes.drawdown && triggerData.drawdown) addStatRow('Drawdown 52w', `${triggerData.drawdown}%`);
    if (includes.rsi && triggerData.rsi) addStatRow('RSI Semanal', triggerData.rsi);
    if (includes.macd && triggerData.macd) addStatRow('MACD Hist', triggerData.macd);
    if (includes.opScore && triggerData.opScore) addStatRow('OP Score', `${triggerData.opScore}/100`);

    htmlStats += `
        </table>
      </div>
    `;
  }

  const finalHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #0f172a; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .logo-container { margin-bottom: 24px; text-align: center; }
        .logo-img { max-height: 55px; width: auto; vertical-align: middle; }
        .header-title { margin: 0; font-size: 16px; font-weight: 500; color: #94a3b8; letter-spacing: 0.025em; text-transform: uppercase; }
        .content { padding: 32px 24px; }
        .message { font-size: 16px; line-height: 1.6; color: #e2e8f0; margin-bottom: 24px; font-weight: 300; }
        .footer { text-align: center; padding: 24px; font-size: 12px; color: #64748b; font-weight: 300; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <!-- Logo completo -->
            <div class="logo-container">
              <img src="https://chiappital.surcodes.com/img/Logo-Email.png" alt="Chiappital Logo" class="logo-img" />
            </div>
            <h1 class="header-title">Alerta de Mercado</h1>
          </div>
          <div class="content">
            <div class="message">
              ${formattedText}
            </div>
            ${alert.email_image_url ? `<div style="text-align: center; margin-bottom: 24px;"><img src="cid:attached-image" style="max-width: 100%; border-radius: 8px;" alt="Attached Image" /></div>` : ''}
            ${htmlStats}
          </div>
        </div>
        <div class="footer">
          Recibiste este correo porque configuraste una alerta en tu cuenta de Chiappital.<br>
          © ${new Date().getFullYear()} Chiappital. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  let attachments = [];
  if (alert.email_image_url) {
    try {
      const filename = alert.email_image_url.split('/').pop();
      const filepath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(filepath)) {
        attachments.push({
          filename: filename,
          path: filepath,
          cid: 'attached-image'
        });
      }
    } catch(e) {
      console.error('Error adjuntando imagen al correo:', e);
    }
  }

  return { text: finalText, html: finalHtml, attachments };
}

// PUT /api/alerts/:id/email-config - Update email configuration for an alert
router.put('/:id/email-config', authenticate, upload.single('image'), async (req, res) => {
  const user_id = req.user.id;
  const alertId = req.params.id;
  const { email_enabled, email_recipient, email_subject, email_template, email_includes, remove_image } = req.body;

  try {
    const db = getPool();
    
    // Validate ownership
    const [existing] = await db.execute('SELECT id, email_image_url FROM market_alerts WHERE id = ? AND user_id = ?', [alertId, user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada o no tienes permisos' });
    }

    const includesString = typeof email_includes === 'object' ? JSON.stringify(email_includes) : email_includes;
    
    // Determinar URL de imagen nueva
    let imageUrl = existing[0].email_image_url;
    if (req.file) {
      // Si el frontend local o producción: asume req.protocol / req.get('host')
      const host = process.env.NODE_ENV === 'production' ? 'https://apichiappital.surcodes.com' : `${req.protocol}://${req.get('host')}`;
      imageUrl = `${host}/uploads/${req.file.filename}`;
    } else if (remove_image === 'true') {
      imageUrl = null;
    }

    await db.execute(
      `UPDATE market_alerts 
       SET email_enabled = ?,
           email_recipient = ?,
           email_subject = ?,
           email_template = ?,
           email_includes = ?,
           email_image_url = ?
       WHERE id = ? AND user_id = ?`,
      [
        email_enabled === 'true' || email_enabled === true ? 1 : 0, 
        email_recipient || null, 
        email_subject || null, 
        email_template || null, 
        includesString || null, 
        imageUrl,
        alertId, 
        user_id
      ]
    );

    res.json({ success: true, message: 'Configuración de email guardada', email_image_url: imageUrl });
  } catch (error) {
    console.error('Error updating email config:', error);
    res.status(500).json({ error: 'Error interno al actualizar la configuración de email' });
  }
});

// POST /api/alerts/:id/trigger-actions - Trigger actions when alert hits
router.post('/:id/trigger-actions', authenticate, async (req, res) => {
  const user_id = req.user.id;
  const alertId = req.params.id;
  const triggerData = req.body.triggerData || {};

  try {
    const db = getPool();
    const [rows] = await db.execute('SELECT * FROM market_alerts WHERE id = ? AND user_id = ?', [alertId, user_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    const alert = rows[0];

    // If email is not enabled, just return success
    if (!alert.email_enabled || !alert.email_recipient) {
      return res.json({ success: true, ignored: true, message: 'Email no configurado para esta alerta' });
    }

    const subject = (alert.email_subject || 'Alerta Disparada: {symbol}').replace(/{symbol}/g, alert.symbol);
    const { text, html, attachments } = formatEmailContent(alert, triggerData);

    const emailResult = await sendEmail({ to: alert.email_recipient, subject, text, html, attachments });
    
    if (emailResult) {
      res.json({ success: true, emailSent: true });
    } else {
      res.status(500).json({ error: 'El servicio de email no está configurado correctamente en el backend' });
    }
  } catch (error) {
    console.error('Error triggering alert actions:', error);
    res.status(500).json({ error: 'Error al ejecutar las acciones de la alerta' });
  }
});

// POST /api/alerts/:id/test-email - Test email configuration
router.post('/:id/test-email', authenticate, upload.single('image'), async (req, res) => {
  const { email_recipient, email_subject, email_template, email_includes, existing_image_url } = req.body;

  if (!email_recipient) {
    return res.status(400).json({ error: 'Se requiere un destinatario' });
  }
  
  let testImageUrl = existing_image_url || null;
  if (req.file) {
    const host = process.env.NODE_ENV === 'production' ? 'https://apichiappital.surcodes.com' : `${req.protocol}://${req.get('host')}`;
    testImageUrl = `${host}/uploads/${req.file.filename}`;
  }

  // Create a mock alert object for formatting
  const alertMock = { 
    symbol: 'PRUEBA',
    email_template: email_template || 'Este es un correo de prueba de tus Alertas de {symbol}.',
    email_includes: email_includes || '{}',
    email_image_url: testImageUrl
  };
  
  const triggerDataMock = {
    price: '123.45',
    triggerTime: new Date().toLocaleString(),
    opScore: 85,
    ema21: -2.5,
    drawdown: -10.5,
    rsi: 45.2,
    macd: 0.12
  };

  const subject = (email_subject || 'Prueba de Alerta: {symbol}').replace(/{symbol}/g, 'PRUEBA');
  const { text, html, attachments } = formatEmailContent(alertMock, triggerDataMock);

  try {
    const emailResult = await sendEmail({ to: email_recipient, subject, text, html, attachments });
    if (emailResult) {
      res.json({ success: true, message: 'Correo de prueba enviado' });
    } else {
      res.status(500).json({ error: 'El servicio de email no está configurado correctamente en el backend' });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Error al enviar el correo de prueba' });
  }
});

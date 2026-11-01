// middleware/auth.js - Middleware de verificación JWT
const jwt = require('jsonwebtoken');
const { getPool } = require('../database/db');

/**
 * Middleware que verifica el Bearer token JWT en el header Authorization.
 * Si es válido, agrega req.user con los datos del usuario.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { message: 'Token no proporcionado. Por favor inicia sesión.' }
      });
    }

    const token = authHeader.substring(7); // Quitar "Bearer "

    // Verificar y decodificar el token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: { message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' }
        });
      }
      return res.status(401).json({
        error: { message: 'Token inválido. Por favor inicia sesión nuevamente.' }
      });
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        error: { message: 'Token inválido: payload sin identificador de usuario.' }
      });
    }

    // Verificar que el usuario aún existe en la BD
    const db = getPool();
    const [rows] = await db.execute(
      'SELECT id, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        error: { message: 'Usuario no encontrado. Por favor inicia sesión nuevamente.' }
      });
    }

    // Adjuntar usuario a la request
    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Error en middleware auth:', error);
    return res.status(500).json({
      error: { message: 'Error interno del servidor.' }
    });
  }
}

module.exports = { authenticate };

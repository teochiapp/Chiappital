const version = rows => rows.map(row => ({
  id: Number(row.id), symbol: row.symbol,
  percentage: row.portfolio_percentage == null ? null : Number(row.portfolio_percentage),
  updatedAt: new Date(row.updated_at).toISOString(),
})).sort((a, b) => a.id - b.id);

function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

async function importIeb(pool, userId, payload) {
  const { accountType, expected, items, zeroIds, report } = payload;
  if (!['propia', 'compartida'].includes(accountType) || !Array.isArray(expected)
      || !Array.isArray(items) || items.length > 500 || !Array.isArray(zeroIds) || zeroIds.length > 500) {
    fail('La revisión de importación no es válida.');
  }
  if (!report || typeof report.fileName !== 'string' || report.fileName.length > 255
      || !/^\d{4}-\d{2}-\d{2}$/.test(report.date) || !Number.isFinite(report.total) || !(report.total > 0)) {
    fail('Revisá la fecha y el patrimonio del reporte.');
  }
  const symbols = new Set();
  const targets = new Set();
  for (const item of items) {
    if (typeof item.symbol !== 'string' || !/^[A-Z0-9.^=_/-]{1,20}$/.test(item.symbol)
        || !Number.isFinite(item.percentage) || item.percentage < 0 || item.percentage > 100) {
      fail('Hay tickers o porcentajes inválidos.');
    }
    if (symbols.has(item.symbol)) fail('Resolvé los tickers repetidos antes de importar.');
    symbols.add(item.symbol);
    if (item.targetId !== null) {
      if (!Number.isInteger(item.targetId) || targets.has(item.targetId)) fail('Hay destinos repetidos o inválidos.');
      targets.add(item.targetId);
    }
  }
  if (!items.length && !zeroIds.length) fail('Seleccioná al menos un cambio.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Serializa las importaciones del usuario y vuelve a verificar la revisión.
    await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    const [rows] = await connection.execute(
      "SELECT * FROM trades WHERE user_id = ? AND account_type = ? AND status = 'open' ORDER BY id FOR UPDATE",
      [userId, accountType]
    );
    const submitted = expected.map(row => ({ ...row, updatedAt: new Date(row.updatedAt).toISOString() })).sort((a, b) => a.id - b.id);
    if (JSON.stringify(submitted) !== JSON.stringify(version(rows))) {
      fail('La cartera cambió desde la revisión. Volvé a cargar la revisión antes de aplicar.', 409);
    }
    const byId = new Map(rows.map(row => [Number(row.id), row]));
    let created = 0;
    let updated = 0;
    for (const item of items) {
      if (item.targetId !== null) {
        const target = byId.get(item.targetId);
        if (!target || target.type !== 'buy' || target.symbol.toUpperCase() !== item.symbol) {
          fail('La posición de destino debe ser una compra abierta del ticker indicado en esta cartera.');
        }
        await connection.execute('UPDATE trades SET portfolio_percentage = ? WHERE id = ? AND user_id = ? AND account_type = ?',
          [item.percentage, item.targetId, userId, accountType]);
        updated++;
      } else {
        if (rows.some(row => row.symbol.toUpperCase() === item.symbol)) fail('El ticker ya existe. Elegí su posición de destino.');
        const notes = 'Importado de IEB · ' + report.date + ' · ' + report.fileName
          + '\n' + String(item.description ?? '').slice(0, 300)
          + '\nImporte en moneda del reporte: ' + String(item.amount ?? '');
        await connection.execute(
          "INSERT INTO trades (user_id, account_type, symbol, type, status, entry_price, portfolio_percentage, notes) VALUES (?, ?, ?, 'buy', 'open', 0, ?, ?)",
          [userId, accountType, item.symbol, item.percentage, notes]
        );
        created++;
      }
    }
    for (const id of new Set(zeroIds)) {
      if (!byId.has(id) || targets.has(id)) fail('Hay posiciones inválidas en la selección de porcentajes a cero.');
      await connection.execute('UPDATE trades SET portfolio_percentage = 0 WHERE id = ? AND user_id = ? AND account_type = ?',
        [id, userId, accountType]);
    }
    await connection.commit();
    return { created, updated, zeroed: new Set(zeroIds).size };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { importIeb };

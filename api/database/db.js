// database/db.js - Conexión MySQL con pool de conexiones
const mysql = require('mysql2/promise');

let pool = null;

/**
 * Obtiene (o crea) el pool de conexiones MySQL.
 */
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Reconectar automáticamente en caso de pérdida de conexión
      enableKeepAlive: true,
      keepAliveInitialDelay: 30000,
    });
  }
  return pool;
}

/**
 * Inicializa las tablas si no existen.
 * Se llama una vez al arrancar el servidor.
 */
async function initializeDatabase() {
  const db = getPool();

  // Tabla de usuarios
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      username    VARCHAR(100) NOT NULL UNIQUE,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Tabla de trades
  await db.execute(`
    CREATE TABLE IF NOT EXISTS trades (
      id                   INT AUTO_INCREMENT PRIMARY KEY,
      user_id              INT NOT NULL,
      symbol               VARCHAR(20) NOT NULL,
      type                 ENUM('buy', 'sell') NOT NULL,
      account_type         ENUM('propia', 'compartida') NOT NULL DEFAULT 'propia',
      entry_price          DECIMAL(15, 6) NOT NULL,
      entry_price_ars      DECIMAL(15, 6) DEFAULT NULL,
      exit_price           DECIMAL(15, 6) DEFAULT NULL,
      portfolio_percentage DECIMAL(5, 2) DEFAULT NULL,
      stop_loss            DECIMAL(15, 6) DEFAULT NULL,
      take_profit          DECIMAL(15, 6) DEFAULT NULL,
      strategy             VARCHAR(100) DEFAULT NULL,
      emotions             ENUM('confident','nervous','greedy','fearful','calm','frustrated') DEFAULT NULL,
      notes                TEXT DEFAULT NULL,
      custom_country       VARCHAR(50) DEFAULT NULL,
      custom_sector        VARCHAR(50) DEFAULT NULL,
      status               ENUM('open','closed','cancelled') NOT NULL DEFAULT 'open',
      result               DECIMAL(10, 4) DEFAULT NULL,
      closed_at            DATETIME DEFAULT NULL,
      created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Tabla de balances (capital total)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS portfolio_balances (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      account_type ENUM('propia', 'compartida') NOT NULL,
      total_usd    DECIMAL(15, 2) NOT NULL DEFAULT 0,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_account (user_id, account_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Tabla de métricas históricas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS historical_metrics (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      account_type ENUM('propia', 'compartida') NOT NULL DEFAULT 'compartida',
      month_year   VARCHAR(50) NOT NULL,
      usd_start    DECIMAL(15, 2) NOT NULL DEFAULT 0,
      deposits     DECIMAL(15, 2) NOT NULL DEFAULT 0,
      usd_end      DECIMAL(15, 2) NOT NULL DEFAULT 0,
      var_percent  DECIMAL(10, 4) NOT NULL DEFAULT 0,
      var_spy      DECIMAL(10, 4) NOT NULL DEFAULT 0,
      difference   DECIMAL(10, 4) NOT NULL DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_account_month (user_id, account_type, month_year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migración para BD existente en Hostinger: Agregar columna account_type si no existe
  try {
    await db.execute(`
      ALTER TABLE trades 
      ADD COLUMN account_type ENUM('propia', 'compartida') NOT NULL DEFAULT 'propia' AFTER type;
    `);
    console.log('✅ Migración: Columna account_type agregada a trades');
  } catch (error) {
    // Ignorar error si la columna ya existe (ER_DUP_FIELDNAME - 1060)
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar account_type:', error.message);
    }
  }

  // Migración: Agregar columna entry_price_ars
  try {
    await db.execute(`
      ALTER TABLE trades 
      ADD COLUMN entry_price_ars DECIMAL(15, 6) DEFAULT NULL AFTER entry_price;
    `);
    console.log('✅ Migración: Columna entry_price_ars agregada a trades');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar entry_price_ars:', error.message);
    }
  }

  // Migración: Agregar custom_country y custom_sector
  try {
    await db.execute(`
      ALTER TABLE trades 
      ADD COLUMN custom_country VARCHAR(50) DEFAULT NULL AFTER notes,
      ADD COLUMN custom_sector VARCHAR(50) DEFAULT NULL AFTER custom_country;
    `);
    console.log('✅ Migración: Columnas custom_country y custom_sector agregadas a trades');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar custom_country y custom_sector:', error.message);
    }
  }

  // Migración: Agregar columna sector_analysis (JSON)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN sector_analysis JSON DEFAULT NULL;`);
    console.log('✅ Migración: Columna sector_analysis agregada a users');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al agregar sector_analysis:', error.message);
    }
  }

  // Migración: Agregar columna country_analysis (JSON)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN country_analysis JSON DEFAULT NULL;`);
    console.log('✅ Migración: Columna country_analysis agregada a users');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al agregar country_analysis:', error.message);
    }
  }

  // Migración: Agregar columna checklist_history (JSON)
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN checklist_history JSON DEFAULT NULL;`);
    console.log('✅ Migración: Columna checklist_history agregada a users');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al agregar checklist_history:', error.message);
    }
  }

  // Tabla para preferencias de Lab (Sector, Country, Checklist)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS lab_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      sector_analysis JSON DEFAULT NULL,
      country_analysis JSON DEFAULT NULL,
      checklist_history JSON DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ─── Personal Hub Tables ──────────────────────────────────────────────────

  // Feature flags por usuario
  await db.execute(`
    CREATE TABLE IF NOT EXISTS features (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      feature_name VARCHAR(100) NOT NULL,
      enabled      TINYINT(1) NOT NULL DEFAULT 0,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_feature (user_id, feature_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Hábitos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      name        VARCHAR(200) NOT NULL,
      description TEXT DEFAULT NULL,
      frequency   ENUM('daily','weekly') NOT NULL DEFAULT 'daily',
      days_of_week JSON DEFAULT NULL,
      color       VARCHAR(7) DEFAULT '#52B788',
      icon        VARCHAR(50) DEFAULT NULL,
      active      TINYINT(1) NOT NULL DEFAULT 1,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_habits (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Completados de hábitos (un registro por día/hábito)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habit_completions (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      habit_id     INT NOT NULL,
      user_id      INT NOT NULL,
      completed_on DATE NOT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_habit_date (habit_id, completed_on)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Objetivos personales
  await db.execute(`
    CREATE TABLE IF NOT EXISTS personal_goals (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      title       VARCHAR(300) NOT NULL,
      description TEXT DEFAULT NULL,
      category    ENUM('salud','carrera','aprendizaje','relaciones','viajes','desarrollo') NOT NULL DEFAULT 'desarrollo',
      progress    DECIMAL(5,2) NOT NULL DEFAULT 0,
      deadline    DATE DEFAULT NULL,
      status      ENUM('active','completed','paused','cancelled') NOT NULL DEFAULT 'active',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_goals (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Libros
  await db.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      title       VARCHAR(300) NOT NULL,
      author      VARCHAR(200) DEFAULT NULL,
      status      ENUM('pending','reading','completed') NOT NULL DEFAULT 'pending',
      progress    INT NOT NULL DEFAULT 0,
      total_pages INT DEFAULT NULL,
      notes       TEXT DEFAULT NULL,
      rating      TINYINT DEFAULT NULL,
      cover_url   VARCHAR(500) DEFAULT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_books (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Entrenamientos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workouts (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      type        VARCHAR(100) NOT NULL,
      duration    INT DEFAULT NULL,
      date        DATE NOT NULL,
      notes       TEXT DEFAULT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_workouts (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Idiomas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS languages (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      language      VARCHAR(100) NOT NULL,
      level         ENUM('beginner','elementary','intermediate','upper_intermediate','advanced','proficient') NOT NULL DEFAULT 'beginner',
      hours_studied DECIMAL(8,2) NOT NULL DEFAULT 0,
      goal          TEXT DEFAULT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_language (user_id, language)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Tareas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      title       VARCHAR(300) NOT NULL,
      priority    ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
      status      ENUM('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
      deadline    DATE DEFAULT NULL,
      goal_id     INT DEFAULT NULL,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES personal_goals(id) ON DELETE SET NULL,
      INDEX idx_user_tasks (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Vocabulario
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      word          VARCHAR(255) NOT NULL,
      translation   VARCHAR(255) NOT NULL,
      language      VARCHAR(50) DEFAULT 'portugués',
      notes         TEXT,
      repetition    INT DEFAULT 0,
      ease_factor   FLOAT DEFAULT 2.5,
      interval_days INT DEFAULT 0,
      next_review   DATE,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_vocabulary (user_id, next_review)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Journals
  await db.execute(`
    CREATE TABLE IF NOT EXISTS journals (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      user_id     INT NOT NULL,
      date        DATE NOT NULL,
      content     TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_date (user_id, date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Récords Personales (Fitness)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS personal_records (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      exercise      VARCHAR(150) NOT NULL,
      record_value  VARCHAR(50) NOT NULL,
      record_date   DATE NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_exercise (user_id, exercise)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Migración: Agregar days_of_week a habits
  try {
    await db.execute(`ALTER TABLE habits ADD COLUMN days_of_week JSON DEFAULT NULL;`);
    console.log('✅ Migración: Columna days_of_week agregada a habits');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al agregar days_of_week:', error.message);
    }
  }

  // Focus Sessions
  await db.execute(`
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      description VARCHAR(300) NOT NULL,
      duration INT NOT NULL, /* minutes */
      session_date DATETIME NOT NULL,
      status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_sessions (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ─── Recetario Mediterráneo ──────────────────────────────────────────────────

  // Recetas mediterráneas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS med_recipes (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      user_id           INT NOT NULL,
      name              VARCHAR(300) NOT NULL,
      origin_country    VARCHAR(100) DEFAULT NULL,
      category          ENUM('desayuno','almuerzo','cena','snack','postre') NOT NULL DEFAULT 'almuerzo',
      prep_time         INT DEFAULT NULL,
      cook_time         INT DEFAULT NULL,
      difficulty        TINYINT DEFAULT 3,
      cost              ENUM('$','$$','$$$') DEFAULT '$$',
      servings          INT DEFAULT 2,
      calories          INT DEFAULT NULL,
      protein           DECIMAL(6,2) DEFAULT NULL,
      carbs             DECIMAL(6,2) DEFAULT NULL,
      fat               DECIMAL(6,2) DEFAULT NULL,
      fiber             DECIMAL(6,2) DEFAULT NULL,
      ingredients       JSON DEFAULT NULL,
      steps             JSON DEFAULT NULL,
      tips              JSON DEFAULT NULL,
      health_tags       JSON DEFAULT NULL,
      frequency         ENUM('diaria','varias_semana','semanal','ocasional') DEFAULT 'semanal',
      tags              JSON DEFAULT NULL,
      learning          JSON DEFAULT NULL,
      image_url         TEXT DEFAULT NULL,
      is_favorite       TINYINT(1) DEFAULT 0,
      created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_recipes (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Historial de recetas cocinadas
  await db.execute(`
    CREATE TABLE IF NOT EXISTS med_cooking_history (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      recipe_id    INT NOT NULL,
      cooked_on    DATE NOT NULL,
      rating       TINYINT DEFAULT NULL,
      notes        TEXT DEFAULT NULL,
      would_change TEXT DEFAULT NULL,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES med_recipes(id) ON DELETE CASCADE,
      INDEX idx_user_history (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Lista de compras mediterránea
  await db.execute(`
    CREATE TABLE IF NOT EXISTS med_shopping_list (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      name       VARCHAR(200) NOT NULL,
      qty        VARCHAR(50) DEFAULT NULL,
      unit       VARCHAR(50) DEFAULT NULL,
      category   VARCHAR(100) DEFAULT 'otros',
      recipe_id  INT DEFAULT NULL,
      checked    TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipe_id) REFERENCES med_recipes(id) ON DELETE SET NULL,
      INDEX idx_user_shopping (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Objetivos semanales mediterráneos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS med_weekly_goals (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      week_start    DATE NOT NULL,
      fish_count    INT DEFAULT 0,
      legumes_count INT DEFAULT 0,
      fruit_days    JSON DEFAULT NULL,
      veggie_days   JSON DEFAULT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY idx_user_week (user_id, week_start)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Alertas de Mercado
  await db.execute(`
    CREATE TABLE IF NOT EXISTS market_alerts (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      symbol        VARCHAR(20) NOT NULL,
      target_price  DECIMAL(15, 6) NOT NULL,
      condition_type ENUM('above', 'below') NOT NULL,
      is_active     TINYINT(1) NOT NULL DEFAULT 1,
      notes         TEXT DEFAULT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_alerts (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ─── Market Data Sync ────────────────────────────────────────────────────────

  // Símbolos rastreados en background
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tracked_symbols (
      symbol VARCHAR(20) PRIMARY KEY,
      name VARCHAR(100) DEFAULT NULL,
      exchange VARCHAR(50) DEFAULT NULL,
      market VARCHAR(50) DEFAULT NULL,
      enabled TINYINT(1) DEFAULT 1,
      priority INT DEFAULT 2,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Snapshot del mercado
  await db.execute(`
    CREATE TABLE IF NOT EXISTS market_snapshot (
      symbol VARCHAR(20) PRIMARY KEY,
      price DECIMAL(15, 6) DEFAULT NULL,
      change_amount DECIMAL(15, 6) DEFAULT NULL,
      change_percent DECIMAL(10, 4) DEFAULT NULL,
      ema21_distance DECIMAL(10, 4) DEFAULT NULL,
      ema_updated_at DATETIME DEFAULT NULL,
      rsi_weekly DECIMAL(10, 2) DEFAULT NULL,
      rsi_previous DECIMAL(10, 2) DEFAULT NULL,
      rsi_delta DECIMAL(10, 2) DEFAULT NULL,
      rsi_updated_at DATETIME DEFAULT NULL,
      macd_weekly DECIMAL(10, 2) DEFAULT NULL,
      macd_signal DECIMAL(10, 2) DEFAULT NULL,
      macd_hist DECIMAL(10, 2) DEFAULT NULL,
      macd_prev_weekly DECIMAL(10, 2) DEFAULT NULL,
      macd_prev_signal DECIMAL(10, 2) DEFAULT NULL,
      macd_prev_hist DECIMAL(10, 2) DEFAULT NULL,
      drawdown_52w DECIMAL(10, 4) DEFAULT NULL,
      source VARCHAR(50) DEFAULT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      status ENUM('LIVE', 'STALE', 'ERROR', 'SYNCING') DEFAULT 'LIVE',
      FOREIGN KEY (symbol) REFERENCES tracked_symbols(symbol) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN ema_updated_at DATETIME DEFAULT NULL AFTER ema21_distance;
    `);
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar ema_updated_at:', error.message);
    }
  }

  // Migración: Agregar columnas RSI a market_snapshot
  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN rsi_weekly DECIMAL(10, 2) DEFAULT NULL AFTER ema_updated_at,
      ADD COLUMN rsi_previous DECIMAL(10, 2) DEFAULT NULL AFTER rsi_weekly,
      ADD COLUMN rsi_delta DECIMAL(10, 2) DEFAULT NULL AFTER rsi_previous,
      ADD COLUMN rsi_updated_at DATETIME DEFAULT NULL AFTER rsi_delta;
    `);
    console.log('✅ Migración: Columnas de RSI agregadas a market_snapshot');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columnas de RSI:', error.message);
    }
  }

  // Migración: Agregar columnas Setup a market_snapshot
  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN setup_state VARCHAR(50) DEFAULT NULL AFTER drawdown_52w,
      ADD COLUMN setup_verdict VARCHAR(255) DEFAULT NULL AFTER setup_state,
      ADD COLUMN setup_factors JSON DEFAULT NULL AFTER setup_verdict;
    `);
    console.log('✅ Migración: Columnas de Setup agregadas a market_snapshot');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columnas de Setup:', error.message);
    }
  }

  // Migración: Agregar columnas MACD a market_snapshot
  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN macd_weekly DECIMAL(10, 2) DEFAULT NULL AFTER rsi_updated_at,
      ADD COLUMN macd_signal DECIMAL(10, 2) DEFAULT NULL AFTER macd_weekly,
      ADD COLUMN macd_hist DECIMAL(10, 2) DEFAULT NULL AFTER macd_signal,
      ADD COLUMN macd_prev_weekly DECIMAL(10, 2) DEFAULT NULL AFTER macd_hist,
      ADD COLUMN macd_prev_signal DECIMAL(10, 2) DEFAULT NULL AFTER macd_prev_weekly,
      ADD COLUMN macd_prev_hist DECIMAL(10, 2) DEFAULT NULL AFTER macd_prev_signal;
    `);
    console.log('✅ Migración: Columnas de MACD agregadas a market_snapshot');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columnas de MACD:', error.message);
    }
  }

  // Migración: Agregar columna drawdown_52w a market_snapshot
  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN drawdown_52w DECIMAL(10, 4) DEFAULT NULL AFTER macd_prev_hist;
    `);
    console.log('✅ Migración: Columna drawdown_52w agregada a market_snapshot');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columna drawdown_52w:', error.message);
    }
  }

  // Migración: Agregar columna index_symbol a tracked_symbols
  try {
    await db.execute(`
      ALTER TABLE tracked_symbols 
      ADD COLUMN index_symbol VARCHAR(20) DEFAULT NULL AFTER market;
    `);
    console.log('✅ Migración: Columna index_symbol agregada a tracked_symbols');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columna index_symbol:', error.message);
    }
  }

  // Migración: Agregar columnas de Relative Strength a market_snapshot
  try {
    await db.execute(`
      ALTER TABLE market_snapshot 
      ADD COLUMN rs_value DECIMAL(10, 4) DEFAULT NULL AFTER drawdown_52w,
      ADD COLUMN rs_previous DECIMAL(10, 4) DEFAULT NULL AFTER rs_value,
      ADD COLUMN rs_state VARCHAR(50) DEFAULT NULL AFTER rs_previous,
      ADD COLUMN rs_updated_at DATETIME DEFAULT NULL AFTER rs_state;
    `);
    console.log('✅ Migración: Columnas de Relative Strength agregadas a market_snapshot');
  } catch (error) {
    if (error.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Error al intentar agregar columnas de RS:', error.message);
    }
  }

  console.log('✅ Base de datos inicializada correctamente');
}

module.exports = { getPool, initializeDatabase };

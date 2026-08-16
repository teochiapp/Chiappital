const fs = require('fs');
const path = require('path');

// Cargar variables de entorno si aún no lo están
require('dotenv').config();

const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const COLORS = {
  DEBUG: '\x1b[90m', // Gris
  INFO: '\x1b[36m',  // Cyan
  WARN: '\x1b[33m',  // Amarillo
  ERROR: '\x1b[31m', // Rojo
  RESET: '\x1b[0m',  // Reset
};

function getLogLevel() {
  const envLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toUpperCase() : 'INFO';
  return LEVELS[envLevel] !== undefined ? LEVELS[envLevel] : LEVELS.INFO;
}

const currentLevel = getLogLevel();

function formatTime() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Memoria para el frontend
const logsBuffer = [];
const MAX_LOGS = 100;
let latestMetrics = {
  finnhubRequests: 0,
  finnhubSuccess: 0,
  yahooRequests: 0,
  yahooSuccess: 0,
  emaUpdated: 0,
  emaFailed: 0,
  stale: 0,
  fresh: 0,
  duration: 0
};

function printLog(levelName, context, message) {
  if (LEVELS[levelName] < currentLevel) return;

  const timeStr = formatTime();
  const color = COLORS[levelName];
  const reset = COLORS.RESET;

  // Formato consola
  const levelStr = levelName.padEnd(5, ' ');
  const contextStr = context ? `[${context}] ` : '';

  console[levelName === 'ERROR' ? 'error' : levelName === 'WARN' ? 'warn' : 'log'](
    `${color}[${timeStr}] ${levelStr} ${reset} ${contextStr}${message}`
  );

  // Formato para memoria
  if (levelName === 'INFO' || levelName === 'WARN' || levelName === 'ERROR') {
    logsBuffer.unshift({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      level: levelName === 'INFO' ? 'SUCCESS' : levelName === 'WARN' ? 'WARNING' : 'ERROR',
      message: message,
      category: context || 'SYSTEM'
    });

    if (logsBuffer.length > MAX_LOGS) {
      logsBuffer.pop();
    }
  }
}

const logger = {
  debug: (context, message) => printLog('DEBUG', context, message),
  info: (context, message) => printLog('INFO', context, message),
  warn: (context, message) => printLog('WARN', context, message),
  error: (context, message) => printLog('ERROR', context, message),
  
  // Helpers
  raw: (message) => console.log(message),
  
  // Frontend Bridge
  getLogs: () => logsBuffer,
  getMetrics: () => latestMetrics,
  setMetrics: (metrics) => { latestMetrics = { ...latestMetrics, ...metrics }; }
};

module.exports = logger;

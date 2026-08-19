// config/environment.js - Configuración de variables de entorno
const config = {
  // En desarrollo: http://localhost:3001 (cuando el backend local está corriendo)
  // En producción: la URL de tu Node.js App en Hostinger
  API_URL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production'
      ? 'https://apichiappital.surcodes.com'
      : 'http://localhost:3000'
  ),

  // APIs externas de mercado (sin cambios)
  FINNHUB_API_KEY: process.env.REACT_APP_FINNHUB_API_KEY || 'd3t6mg9r01qqdgfufaggd3t6mg9r01qqdgfufah0',

  // Configuración de la aplicación
  APP_NAME: 'Chiappital',
  APP_VERSION: '1.0.0',

  // Configuración de entorno
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
};

export default config;

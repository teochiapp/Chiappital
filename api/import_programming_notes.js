// Chiappital/api/import_programming_notes.js
const fs = require('fs');
const path = require('path');
require('./node_modules/dotenv').config({ path: path.join(__dirname, '.env.local') });
const { getPool, initializeDatabase } = require('./database/db');

const USER_ID = 1;
const AREA_ID = 1; // Programming
const CATEGORY_ID = 28; // Programación

const progSourceDir = path.resolve(__dirname, '../notion/Programación');
const optimizedDir = path.resolve(progSourceDir, 'optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// ─── Tags List ─────────────────────────────────────────────────────────────
const ALL_TAGS = [
  { name: 'programming', color: '#3b82f6' },
  { name: 'software-engineering', color: '#6366f1' },
  { name: 'architecture', color: '#8b5cf6' },
  { name: 'roadmap', color: '#ec4899' },
  { name: 'fullstack', color: '#10b981' },
  { name: 'backend', color: '#0ea5e9' },
  { name: 'frontend', color: '#f59e0b' },
  { name: 'auth', color: '#ef4444' },
  { name: 'jwt', color: '#f97316' },
  { name: 'oauth', color: '#84cc16' },
  { name: 'security', color: '#dc2626' },
  { name: 'cookies', color: '#d97706' },
  { name: 'caching', color: '#06b6d4' },
  { name: 'redis', color: '#e11d48' },
  { name: 'performance', color: '#10b981' },
  { name: 'api', color: '#3b82f6' },
  { name: 'rest', color: '#2563eb' },
  { name: 'json-api', color: '#64748b' },
  { name: 'graphql', color: '#e11d48' },
  { name: 'http', color: '#6b7280' },
  { name: 'owasp', color: '#b91c1c' },
  { name: 'cors', color: '#f59e0b' },
  { name: 'ssl', color: '#059669' },
  { name: 'tls', color: '#10b981' },
  { name: 'csp', color: '#7c3aed' },
  { name: 'css', color: '#2563eb' },
  { name: 'styling', color: '#38bdf8' },
  { name: 'ui', color: '#ec4899' },
  { name: 'box-model', color: '#6366f1' },
  { name: 'z-index', color: '#8b5cf6' },
  { name: 'overflow', color: '#a855f7' },
  { name: 'bem', color: '#14b8a6' },
  { name: 'methodology', color: '#64748b' },
  { name: 'modular-css', color: '#0284c7' },
  { name: 'flexbox', color: '#3b82f6' },
  { name: 'layout', color: '#8b5cf6' },
  { name: 'cheatsheet', color: '#eab308' },
  { name: 'grid', color: '#6366f1' },
  { name: '2d-layout', color: '#4f46e5' },
  { name: 'responsive', color: '#10b981' },
  { name: 'mobile-first', color: '#059669' },
  { name: 'media-queries', color: '#0d9488' },
  { name: 'tips', color: '#f59e0b' },
  { name: 'resets', color: '#71717a' },
  { name: 'clean-code', color: '#10b981' },
  { name: 'javascript', color: '#eab308' },
  { name: 'best-practices', color: '#3b82f6' },
  { name: 'craftsmanship', color: '#8b5cf6' },
  { name: 'critical-rendering-path', color: '#ef4444' },
  { name: 'seo', color: '#16a34a' },
  { name: 'a11y', color: '#2563eb' },
  { name: 'clean-architecture', color: '#9333ea' },
  { name: 'agile', color: '#0ea5e9' },
  { name: 'solid', color: '#4f46e5' },
  { name: 'tdd', color: '#16a34a' },
  { name: 'design-patterns', color: '#7c3aed' },
  { name: 'react', color: '#06b6d4' },
  { name: 'jsx', color: '#0284c7' },
  { name: 'components', color: '#3b82f6' },
  { name: 'virtual-dom', color: '#6366f1' },
  { name: 'context-api', color: '#8b5cf6' },
  { name: 'state-management', color: '#ec4899' },
  { name: 'hooks', color: '#06b6d4' },
  { name: 'refactoring', color: '#f97316' },
  { name: 'technical-debt', color: '#dc2626' },
  { name: 'code-smells', color: '#ea580c' },
  { name: 'quality', color: '#10b981' },
  { name: 'html', color: '#f97316' },
  { name: 'semantic-web', color: '#ea580c' }
];

// ─── Helpers de Limpieza de Notion ──────────────────────────────────────────
function cleanNotionMarkdown(rawContent, title, wikilinks = [], customReplacements = []) {
  let content = rawContent;

  // 1. Quitar título H1 inicial si existe para normalizar
  content = content.replace(/^#\s+[^\n]+\n+/, '');

  // 2. Reemplazos personalizados de imágenes o rutas
  for (const rep of customReplacements) {
    content = content.replace(rep.pattern, rep.replacement);
  }

  // 3. Limpiar links de Notion con UUIDs tipo [Texto](Subfolder/Archivo%2021e5f...md)
  content = content.replace(/\[([^\]]+)\]\([^)]+\.md\)/g, '$1');

  // 4. Asegurar formato de encabezados limpios
  content = content.replace(/^######\s+/gm, '##### ');
  content = content.replace(/\r\n/g, '\n');
  content = content.replace(/\n{4,}/g, '\n\n');

  // 5. Encabezado profesional con metadata y wikilinks
  let header = `# ${title}\n\n`;
  header += `> 📌 **Categoría:** [[Programación]] | **Área:** Programming\n`;
  header += `> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack\n\n`;

  // 6. Pie de nota con navegación
  let footer = '\n\n---\n\n### 🔗 Conexiones & Referencias en el Grafo\n';
  footer += `- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]\n`;
  for (const wl of wikilinks) {
    footer += `- [[${wl}]]\n`;
  }

  return header + content.trim() + footer;
}

// ─── Definición de Notas y Archivos Fuente ──────────────────────────────────
const noteSpecs = [
  // 00. MASTER HUB (Se genera con contenido sintético completo)
  {
    isHub: true,
    key: 'hub',
    title: 'PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base',
    filename: 'PROG 00. Programming Master Roadmap.md',
    tags: ['programming', 'software-engineering', 'architecture', 'roadmap', 'fullstack'],
    wikilinks: [
      'PROG 01. Backend — Authentication & Token Strategies',
      'PROG 02. Backend — Caching Strategies & Architecture',
      'PROG 03. Backend — API Architecture & Design Patterns',
      'PROG 04. Backend — Web Security & OWASP Defense',
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 12. Clean Code — JavaScript Principles & Best Practices',
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices',
      'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile',
      'PROG 15. React — Core Fundamentals & Component Architecture',
      'PROG 17. Refactoring — Eliminating Technical Debt & Code Smells',
      'PROG 18. HTML — Semantic Structure & SEO Foundations'
    ],
    getContent: () => `# PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base

> 🧭 **Centro de Comando de Arquitectura & Desarrollo de Software**
> 
> Base de conocimiento unificada que consolida estándares de industria, arquitecturas resilientes, diseño de interfaces modernas, seguridad web y patrones de software craftsmanship.

---

## 🗺️ Mapa de Dominios de Ingeniería

\`\`\`
                               ┌──────────────────────────────────────────────────────────┐
                               │   PROG 00. SOFTWARE ENGINEERING & ARCHITECTURE HUB       │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
         ┌───────────────────────────┬──────────────────────┴───────────────┬───────────────────────────┐
         ▼                           ▼                                      ▼                           ▼
┌──────────────────┐       ┌──────────────────┐                   ┌──────────────────┐        ┌──────────────────┐
│   BACKEND CORE   │       │  CSS & STYLING   │                   │ REACT ECOSYSTEM  │        │ CRAFTSMANSHIP &  │
│  & ARCHITECTURE  │       │  MODERN LAYOUT   │                   │ & STATE DESIGN   │        │   CLEAN CODE     │
├──────────────────┤       ├──────────────────┤                   ├──────────────────┤        ├──────────────────┤
│ • Auth & Tokens  │       │ • CSS Master Hub │                   │ • React Basics   │        │ • Clean Code JS  │
│ • Caching Layers │       │ • Box Model/Core │                   │ • Context API    │        │ • Clean Agile    │
│ • API Design     │       │ • BEM Method     │                   │ • Component Arch │        │ • Clean Arch     │
│ • Web Security   │       │ • Flexbox / Grid │                   │ • Hooks Patterns │        │ • Refactoring    │
│ • OWASP Defense  │       │ • Responsive/RWD │                   └──────────────────┘        │ • Tech Debt      │
└──────────────────┘       │ • Pro Tips/Reset │                                               └──────────────────┘
                           └──────────────────┘
\`\`\`

---

## 📚 Estructura Detallada de Módulos

### 1. ⚙️ Backend, APIs & Resiliencia
- [[PROG 01. Backend — Authentication & Token Strategies]]: Comparativa de JWT, OAuth 2.0, sesiones stateful, cookies seguras y arquitecturas de autenticación modernas.
- [[PROG 02. Backend — Caching Strategies & Architecture]]: Patrones de Cache-Aside, Write-Through, Write-Back, políticas de expiración (LRU, TTL) y mitigación de estampidas de caché.
- [[PROG 03. Backend — API Architecture & Design Patterns]]: Principios REST, verbos HTTP idempotentes, códigos de estado, especificaciones JSON:API, GraphQL y RPC.
- [[PROG 04. Backend — Web Security & OWASP Defense]]: Guía de mitigación del OWASP Top 10, implementación de CORS, apretón de manos SSL/TLS y directivas Content Security Policy (CSP).

---

### 2. 🎨 CSS Moderno & Diseño de Layouts
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]: Visión holística del motor de renderizado CSS, cascada, especificidad y arquitecturas modulares.
- [[PROG 06. CSS — Core Fundamentals & Box Model]]: Modelo de caja, \`box-sizing: border-box\`, contextos de apilamiento con \`z-index\` y control de overflow.
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]: Convenciones Block-Element-Modifier, aplanamiento de especificidad y diseño de componentes reutilizables.
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]: Distribución unidimensional (1D), ejes principal y transversal, alineación y cheatsheet visual.
- [[PROG 09. CSS — Grid Layout & 2D Page Architecture]]: Grillas bidimensionales (2D), áreas nominales, unidades fraccionarias \`fr\`, \`repeat()\` y \`minmax()\`.
- [[PROG 10. CSS — Responsive Web Design & Viewports]]: Configuración de viewports, estrategias Mobile-First vs Desktop-First y tipografía fluida con \`clamp()\`.
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]: Resets modernos, selectores avanzados (\`:has()\`, \`:is()\`, \`:where()\`) y aceleración por GPU.

---

### 3. 🌐 Frontend & Fundamentos Web
- [[PROG 18. HTML — Semantic Structure & SEO Foundations]]: Arquitectura semántica accesible, landmarks, metadatos sociales (Open Graph) y optimización SEO técnica.
- [[PROG 13. Frontend — Web Performance, Critical Path & Best Practices]]: Ruta crítica de renderizado (DOM/CSSOM/Layout/Paint), Core Web Vitals (LCP, INP, CLS) y eliminación de bloqueos de renderizado.

---

### 4. ⚛️ Ecosistema React
- [[PROG 15. React — Core Fundamentals & Component Architecture]]: Modelo declarativo, reconciliador Virtual DOM / Fiber, inmutabilidad de estado y estructura de proyectos.
- [[PROG 16. React — Context API & State Management]]: Eliminación de Prop Drilling, patrón Provider + Custom Hooks, y división de contextos para evitar re-renders innecesarios.

---

### 5. 🧹 Calidad, Arquitectura & Refactoring
- [[PROG 12. Clean Code — JavaScript Principles & Best Practices]]: Nombres con intención, funciones de responsabilidad única, guard clauses y programación funcional inmutable.
- [[PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile]]: La guía definitiva: anillos de Clean Agile, arquitectura hexagonal / Onion, principios SOLID y patrones de diseño vs patrones arquitectónicos.
- [[PROG 17. Refactoring — Eliminating Technical Debt & Code Smells]]: La regla de tres, catálogo de code smells (Bloaters, Couplers, Dispensables) y estrategias seguras de refactorización.

---

### 🎯 Recomendación de Rutas de Estudio
1. **Ruta Frontend Specialist**: HTML Semántico ➔ CSS Master (Box Model, Flexbox, Grid, RWD) ➔ Frontend Performance ➔ React Fundamentals ➔ React Context.
2. **Ruta Backend & Architecture**: API Design ➔ Authentication & Tokens ➔ Caching Strategies ➔ Web Security & OWASP ➔ Clean Architecture.
3. **Ruta Software Craftsmanship**: Clean Code JS ➔ Refactoring & Deuda Técnica ➔ Gentleman Programming (Clean Agile + SOLID + Hexagonal).
`
  },

  // 01. Backend - Authentication
  {
    srcRel: 'Backend/Authentication 21e5f5364dc280509fb8c55900b6e57e.md',
    title: 'PROG 01. Backend — Authentication & Token Strategies',
    filename: 'PROG 01. Backend - Authentication & Tokens.md',
    tags: ['programming', 'backend', 'auth', 'jwt', 'oauth', 'security', 'cookies'],
    wikilinks: [
      'PROG 04. Backend — Web Security & OWASP Defense',
      'PROG 03. Backend — API Architecture & Design Patterns'
    ],
    customReplacements: []
  },

  // 02. Backend - Caching
  {
    srcRel: 'Backend/Caching 21e5f5364dc280519686e142cc3a73e7.md',
    title: 'PROG 02. Backend — Caching Strategies & Architecture',
    filename: 'PROG 02. Backend - Caching Strategies.md',
    tags: ['programming', 'backend', 'caching', 'redis', 'performance', 'architecture'],
    wikilinks: [
      'PROG 03. Backend — API Architecture & Design Patterns',
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices'
    ],
    customReplacements: []
  },

  // 03. Backend - APIs (Enriquecida a partir del contenido base)
  {
    srcRel: 'Backend/APIs 21e5f5364dc28011a666cfe30b1bc8f7.md',
    title: 'PROG 03. Backend — API Architecture & Design Patterns',
    filename: 'PROG 03. Backend - API Architecture.md',
    tags: ['programming', 'backend', 'api', 'rest', 'json-api', 'graphql', 'http'],
    wikilinks: [
      'PROG 01. Backend — Authentication & Token Strategies',
      'PROG 02. Backend — Caching Strategies & Architecture',
      'PROG 04. Backend — Web Security & OWASP Defense'
    ],
    customReplacements: [],
    enhanceContent: (raw) => {
      return `### REST (Representational State Transfer)

A REST API (Representational State Transfer Application Programming Interface) is an architectural style for designing networked applications. It relies on standard HTTP methods (GET, POST, PUT, PATCH, DELETE) to interact with resources, which are represented as URIs (Uniform Resource Identifiers). 

REST APIs are stateless, meaning each request from a client to a server must contain all the information needed to understand and process the request. They use standard HTTP status codes to indicate the outcome of requests and communicate in formats like JSON or XML. REST APIs are widely used due to their simplicity, scalability, and ease of integration with web services and applications.

---

### Principios Fundamentales de REST

1. **Client-Server Architecture**: Separación estricta de responsabilidades entre interfaz de usuario y capa de datos/lógica de negocio.
2. **Statelessness (Sin estado)**: Ningún contexto del cliente se almacena en el servidor entre peticiones. Toda sesión vive en el cliente (tokens, headers).
3. **Cacheability**: Las respuestas deben definirse explícitamente como cacheables o no cacheables (\`Cache-Control\`, \`ETag\`).
4. **Uniform Interface**: Interfaz estándar y predecible mediante URIs de recursos y métodos estándar.
5. **Layered System**: El cliente no puede asumir si está conectado directamente al servidor final o a un intermediario (proxy, CDN, balanceador de carga).

---

### Matriz de Verbos HTTP

| Método | Propósito | ¿Seguro? | ¿Idempotente? | Código Éxito Típico |
| :--- | :--- | :---: | :---: | :--- |
| \`GET\` | Recuperar representación de un recurso | ✅ Sí | ✅ Sí | 200 OK |
| \`POST\` | Crear un nuevo recurso o ejecutar acción | ❌ No | ❌ No | 201 Created |
| \`PUT\` | Reemplazar completamente un recurso | ❌ No | ✅ Sí | 200 OK / 204 No Content |
| \`PATCH\` | Modificación parcial de un recurso | ❌ No | ❌ No | 200 OK |
| \`DELETE\` | Eliminar un recurso | ❌ No | ✅ Sí | 204 No Content / 200 OK |
| \`OPTIONS\` | Consultar capacidades y headers CORS permitidos | ✅ Sí | ✅ Sí | 204 No Content |
| \`HEAD\` | Obtener headers idénticos a GET sin body | ✅ Sí | ✅ Sí | 200 OK |

---

### Cheatsheet de Códigos de Estado HTTP

\`\`\`
2xx Éxito
  200 OK: Petición completada con éxito.
  201 Created: Recurso creado exitosamente (incluir header Location).
  204 No Content: Acción exitosa sin contenido en el body de respuesta (común en DELETE/PUT).

3xx Redirección & Caché
  301 Moved Permanently: El recurso cambió de URI permanentemente.
  304 Not Modified: El recurso no ha cambiado desde la fecha enviada en If-None-Match (ETag).

4xx Errores de Cliente
  400 Bad Request: Sintaxis inválida o parámetros incorrectos.
  401 Unauthorized: Falta autenticación válida o token expirado.
  403 Forbidden: Autenticado pero sin permisos para acceder al recurso.
  404 Not Found: El recurso solicitado no existe.
  409 Conflict: Conflicto con el estado actual del recurso (ej. email duplicado).
  422 Unprocessable Entity: Sintaxis correcta pero validaciones de negocio fallidas.
  429 Too Many Requests: Límite de tasa (Rate Limit) alcanzado.

5xx Errores de Servidor
  500 Internal Server Error: Excepción no capturada en el servidor.
  502 Bad Gateway: El servidor intermediario recibió una respuesta inválida del servidor upstream.
  503 Service Unavailable: Servidor temporalmente fuera de servicio por sobrecarga o mantenimiento.
  504 Gateway Timeout: El upstream no respondió a tiempo.
\`\`\`

---

### JSON:API Specification

JSON or JavaScript Object Notation is an encoding scheme designed to eliminate ad-hoc code for API communication. The JSON:API specification defines conventions for data structures, entity types, relationships, pagination, and error envelopes:

\`\`\`json
{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "Clean Architecture Principles",
      "slug": "clean-architecture-principles"
    },
    "relationships": {
      "author": {
        "data": { "type": "people", "id": "9" }
      }
    }
  }
}
\`\`\`

---

### Comparativa de Paradigmas de API

| Criterio | REST | GraphQL | gRPC | WebSockets |
| :--- | :--- | :--- | :--- | :--- |
| **Protocolo** | HTTP 1.1 / HTTP/2 | HTTP POST | HTTP/2 (Protobuf) | TCP Bidireccional |
| **Payload** | JSON / XML | JSON | Binario compacto | Texto / Binario |
| **Fetch Pattern** | Múltiples endpoints | 1 endpoint (\`/graphql\`) | RPC Methods | Event-Driven Streams |
| **Over/Under fetching** | Posible | Eliminado | Eliminado | No aplica |
| **Mejor para** | APIs públicas, CRUD | UIs complejas, Apps móviles | Microservicios internos | Tiempo real, chats, trading |
`;
    }
  },

  // 04. Backend - Web Security
  {
    srcRel: 'Backend/Web Security 21f5f5364dc280b1be4fd91c9743cb05.md',
    title: 'PROG 04. Backend — Web Security & OWASP Defense',
    filename: 'PROG 04. Backend - Web Security & OWASP.md',
    tags: ['programming', 'backend', 'security', 'owasp', 'cors', 'ssl', 'tls', 'csp'],
    wikilinks: [
      'PROG 01. Backend — Authentication & Token Strategies',
      'PROG 03. Backend — API Architecture & Design Patterns',
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices'
    ],
    customReplacements: [
      {
        pattern: /!\[.*?\]\([^)]*AD4FF334-97DE-4340-98FF-B4C78338F254\.png\)/g,
        replacement: '![TLS Handshake & Encryption Flow](/uploads/prog-websec-ssl-handshake.png)'
      }
    ]
  },

  // 05. CSS Master Hub
  {
    srcRel: 'CSS 7a174c85944a4215801b90e97a43403a.md',
    title: 'PROG 05. CSS — Master Architecture & Modern Styling Guide',
    filename: 'PROG 05. CSS - Master Architecture.md',
    tags: ['programming', 'frontend', 'css', 'styling', 'architecture', 'ui'],
    wikilinks: [
      'PROG 06. CSS — Core Fundamentals & Box Model',
      'PROG 07. CSS — BEM Methodology & Modular Architecture',
      'PROG 08. CSS — Flexbox Layout System & Cheatsheet',
      'PROG 09. CSS — Grid Layout & 2D Page Architecture',
      'PROG 10. CSS — Responsive Web Design & Viewports',
      'PROG 11. CSS — Pro Tips, Modern Resets & Performance'
    ],
    customReplacements: [],
    enhanceContent: () => {
      return `# CSS Master Architecture & Modern Styling Guide

> 🎨 **Arquitectura de Estilos para Aplicaciones Web Escalables**
>
> CSS moderno ha evolucionado de un lenguaje simple de presentación a un potente motor de diseño con soporte para layouts multidimensionales, custom properties (variables), directivas lógicas y renderizado acelerado por hardware.

---

## 🏛️ Pirámide de Especificidad en CSS

La cascada resuelve conflictos calculando un puntaje de especificidad de 4 componentes:

\`\`\`
   (Inline)      (IDs)       (Classes, Attr, Pseudo-clases)    (Elements, Pseudo-elementos)
   [1, 0, 0, 0]  [0, 1, 0, 0]         [0, 0, 1, 0]                     [0, 0, 0, 1]
   style="..."    #header              .nav, [type="text"], :hover      div, h1, ::before
\`\`\`

> ⚠️ **Regla de Oro:** Mantén la especificidad lo más baja y plana posible. Utiliza metodologías como [[PROG 07. CSS — BEM Methodology & Modular Architecture]] para evitar carreras de especificidad y nunca depender de \`!important\`.

---

## 🧭 Selección de Motor de Layout

| Necesidad de Diseño | Herramienta Óptima | Nota de Referencia |
| :--- | :--- | :--- |
| **Alineación 1D** (Filas O Columnas, navbars, cards) | **Flexbox** | [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]] |
| **Estructura 2D** (Filas Y Columnas simultáneas, páginas completas) | **CSS Grid** | [[PROG 09. CSS — Grid Layout & 2D Page Architecture]] |
| **Adaptabilidad Móvil** (Media queries, clamp fluido) | **Responsive Web** | [[PROG 10. CSS — Responsive Web Design & Viewports]] |
| **Modelo de Caja y Apilamiento** (z-index, overflow, borders) | **Box Model** | [[PROG 06. CSS — Core Fundamentals & Box Model]] |
| **Hacks, Selectores Modernos y Resets** (:has, GPU, resets) | **Pro Tips** | [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]] |

---

## 📑 Índice de Módulos CSS

- [[PROG 06. CSS — Core Fundamentals & Box Model]]: Modelo de caja, \`box-sizing\`, contextos de apilamiento y control de desbordamiento.
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]: Convención Block, Element, Modifier para componentes desacoplados.
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]: Diagramas completos de flex container, flex items y alineación en ejes.
- [[PROG 09. CSS — Grid Layout & 2D Page Architecture]]: Grillas complejas, áreas, fracciones \`fr\` y layouts dinámicos con \`auto-fit\`.
- [[PROG 10. CSS — Responsive Web Design & Viewports]]: Meta viewport, media queries, tipografía fluida y optimización multidispositivo.
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]: Resets modernos, selectores avanzados y técnicas de renderizado fluido.
`;
    }
  },

  // 06. CSS - Basics
  {
    srcRel: 'CSS/Basics 436f32d51ac34768b394f5f5bcf9701e.md',
    title: 'PROG 06. CSS — Core Fundamentals & Box Model',
    filename: 'PROG 06. CSS - Core Fundamentals & Box Model.md',
    tags: ['programming', 'frontend', 'css', 'box-model', 'z-index', 'overflow'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 07. CSS — BEM Methodology & Modular Architecture'
    ],
    customReplacements: [
      {
        pattern: /!\[.*?\]\([^)]*image2\.png\)/g,
        replacement: '![CSS Box Model Diagram](/uploads/prog-css-box-model.png)'
      }
    ]
  },

  // 07. CSS - BEM Arquitecture
  {
    srcRel: 'CSS/BEM Arquitecture c323346fe83541d68eef4794b40b6880.md',
    title: 'PROG 07. CSS — BEM Methodology & Modular Architecture',
    filename: 'PROG 07. CSS - BEM Methodology.md',
    tags: ['programming', 'frontend', 'css', 'bem', 'methodology', 'modular-css'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 12. Clean Code — JavaScript Principles & Best Practices'
    ],
    customReplacements: [
      { pattern: /!\[.*?\]\([^)]*image10\.png\)/g, replacement: '![BEM Block Overview](/uploads/prog-css-bem-1.png)' },
      { pattern: /!\[.*?\]\([^)]*image11\.png\)/g, replacement: '![BEM Element Structure](/uploads/prog-css-bem-2.png)' },
      { pattern: /!\[.*?\]\([^)]*image12\.png\)/g, replacement: '![BEM Modifiers](/uploads/prog-css-bem-3.png)' },
      { pattern: /!\[.*?\]\([^)]*image13\.png\)/g, replacement: '![BEM Component Decomposition](/uploads/prog-css-bem-4.png)' },
      { pattern: /!\[.*?\]\([^)]*image14\.png\)/g, replacement: '![BEM Clean Hierarchy](/uploads/prog-css-bem-5.png)' }
    ]
  },

  // 08. CSS - Flexbox
  {
    srcRel: 'CSS/Flexbox 867ad94a17764bfe8c1ddda25806939c.md',
    title: 'PROG 08. CSS — Flexbox Layout System & Cheatsheet',
    filename: 'PROG 08. CSS - Flexbox Layout System.md',
    tags: ['programming', 'frontend', 'css', 'flexbox', 'layout', 'cheatsheet'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 09. CSS — Grid Layout & 2D Page Architecture'
    ],
    customReplacements: [
      { pattern: /!\[.*?\]\([^)]*image3\.png\)/g, replacement: '![Flexbox Main Axis & Cross Axis](/uploads/prog-css-flexbox-1.png)' },
      { pattern: /!\[.*?\]\([^)]*image4\.png\)/g, replacement: '![Flex Direction Flow](/uploads/prog-css-flexbox-2.png)' },
      { pattern: /!\[.*?\]\([^)]*image5\.png\)/g, replacement: '![Justify Content Alignments](/uploads/prog-css-flexbox-3.png)' },
      { pattern: /!\[.*?\]\([^)]*image6\.png\)/g, replacement: '![Align Items Alignments](/uploads/prog-css-flexbox-4.png)' },
      { pattern: /!\[.*?\]\([^)]*image7\.png\)/g, replacement: '![Align Content Multi-Line](/uploads/prog-css-flexbox-5.png)' },
      { pattern: /!\[.*?\]\([^)]*image8\.png\)/g, replacement: '![Flex Item Sizing & Ordering](/uploads/prog-css-flexbox-6.png)' }
    ]
  },

  // 09. CSS - Grid
  {
    srcRel: 'CSS/Grid 45579603bf954c9a9bc6277d84bf06e9.md',
    title: 'PROG 09. CSS — Grid Layout & 2D Page Architecture',
    filename: 'PROG 09. CSS - Grid Layout System.md',
    tags: ['programming', 'frontend', 'css', 'grid', 'layout', '2d-layout'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 08. CSS — Flexbox Layout System & Cheatsheet',
      'PROG 10. CSS — Responsive Web Design & Viewports'
    ],
    customReplacements: []
  },

  // 10. CSS - Responsive Web
  {
    srcRel: 'CSS/Responsive Web e3996f2b481f4c19be1d4ecbfe44ca6c.md',
    title: 'PROG 10. CSS — Responsive Web Design & Viewports',
    filename: 'PROG 10. CSS - Responsive Web Design.md',
    tags: ['programming', 'frontend', 'css', 'responsive', 'mobile-first', 'media-queries'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices'
    ],
    customReplacements: [
      { pattern: /!\[.*?\]\([^)]*image9\.jpeg\)/g, replacement: '![Responsive Viewport Layout](/uploads/prog-css-responsive-1.jpeg)' },
      { pattern: /!\[.*?\]\([^)]*Untitled\.png\)/g, replacement: '![Device Screen Breakpoints](/uploads/prog-css-responsive-2.png)' },
      { pattern: /!\[.*?\]\([^)]*Untitled%201\.png\)/g, replacement: '![Fluid Grid Scaling](/uploads/prog-css-responsive-3.png)' }
    ]
  },

  // 11. CSS - Pro Tips
  {
    srcRel: 'CSS/Pro Tips 8b1f8f1505cf4441872dc2b23db5d9da.md',
    title: 'PROG 11. CSS — Pro Tips, Modern Resets & Performance',
    filename: 'PROG 11. CSS - Pro Tips & Performance.md',
    tags: ['programming', 'frontend', 'css', 'tips', 'resets', 'performance'],
    wikilinks: [
      'PROG 05. CSS — Master Architecture & Modern Styling Guide',
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices'
    ],
    customReplacements: []
  },

  // 12. Clean Code Javascript
  {
    srcRel: 'Good Practices/Clean Code Javascript 9113d3a07a4646eab91acd07372bc596.md',
    title: 'PROG 12. Clean Code — JavaScript Principles & Best Practices',
    filename: 'PROG 12. Clean Code - JavaScript Principles.md',
    tags: ['programming', 'clean-code', 'javascript', 'best-practices', 'craftsmanship'],
    wikilinks: [
      'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile',
      'PROG 17. Refactoring — Eliminating Technical Debt & Code Smells'
    ],
    customReplacements: []
  },

  // 13. Frontend Good Practices
  {
    srcRel: 'Good Practices/Frontend 96a0c7c9267c42c2bdc09361630dc16b.md',
    title: 'PROG 13. Frontend — Web Performance, Critical Path & Best Practices',
    filename: 'PROG 13. Frontend - Web Performance & Best Practices.md',
    tags: ['programming', 'frontend', 'performance', 'critical-rendering-path', 'seo', 'a11y'],
    wikilinks: [
      'PROG 11. CSS — Pro Tips, Modern Resets & Performance',
      'PROG 04. Backend — Web Security & OWASP Defense',
      'PROG 18. HTML — Semantic Structure & SEO Foundations'
    ],
    customReplacements: []
  },

  // 14. Gentleman Programming Book
  {
    srcRel: 'Otros/Gentleman Programming Book 22f5f5364dc2806d9733e6b2c6158835.md',
    title: 'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile',
    filename: 'PROG 14. Software Engineering - Clean Architecture & Agile.md',
    tags: ['programming', 'clean-architecture', 'agile', 'solid', 'tdd', 'design-patterns', 'architecture'],
    wikilinks: [
      'PROG 12. Clean Code — JavaScript Principles & Best Practices',
      'PROG 17. Refactoring — Eliminating Technical Debt & Code Smells',
      'PROG 15. React — Core Fundamentals & Component Architecture'
    ],
    customReplacements: [
      { pattern: /!\[.*?\]\([^)]*5FC92750-99D7-43C7-B29E-B3D5B9A3CD7B\.png\)/g, replacement: '![Clean Agile Outer, Middle and Inner Rings](/uploads/prog-gentleman-clean-agile.png)' },
      { pattern: /!\[.*?\]\([^)]*7C7C095C-464B-41C6-A61B-5F792403A7D4\.png\)/g, replacement: '![Clean Architecture Dependency Rule](/uploads/prog-gentleman-clean-architecture.png)' },
      { pattern: /!\[.*?\]\([^)]*276E554F-4BCD-4E0B-9ACA-2E4F5592BEE8\.png\)/g, replacement: '![Software Architecture Patterns vs Design Patterns](/uploads/prog-gentleman-architecture-patterns.png)' }
    ]
  },

  // 15. React Basics
  {
    srcRel: 'React/Basics 42a132cd63ac484a904c9c5f476dfa1f.md',
    title: 'PROG 15. React — Core Fundamentals & Component Architecture',
    filename: 'PROG 15. React - Core Fundamentals.md',
    tags: ['programming', 'frontend', 'react', 'jsx', 'components', 'virtual-dom'],
    wikilinks: [
      'PROG 16. React — Context API & State Management',
      'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile'
    ],
    customReplacements: []
  },

  // 16. React Context
  {
    srcRel: 'React/Context 765fb6ccb2224468a01e4d97206db248.md',
    title: 'PROG 16. React — Context API & State Management',
    filename: 'PROG 16. React - Context API & State.md',
    tags: ['programming', 'frontend', 'react', 'context-api', 'state-management', 'hooks'],
    wikilinks: [
      'PROG 15. React — Core Fundamentals & Component Architecture',
      'PROG 01. Backend — Authentication & Token Strategies'
    ],
    customReplacements: []
  },

  // 17. Refactoring Basics
  {
    srcRel: 'Refactoring/Basics d122f6c158e548bb84ab6468ce3c6004.md',
    title: 'PROG 17. Refactoring — Eliminating Technical Debt & Code Smells',
    filename: 'PROG 17. Refactoring - Technical Debt & Smells.md',
    tags: ['programming', 'refactoring', 'technical-debt', 'clean-code', 'code-smells', 'quality'],
    wikilinks: [
      'PROG 12. Clean Code — JavaScript Principles & Best Practices',
      'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile'
    ],
    customReplacements: []
  },

  // 18. HTML & SEO
  {
    srcRel: 'HTML 25748cc6adb145519ee9a14ca98585ba.md',
    title: 'PROG 18. HTML — Semantic Structure & SEO Foundations',
    filename: 'PROG 18. HTML - Semantic Structure & SEO.md',
    tags: ['programming', 'frontend', 'html', 'semantic-web', 'seo', 'accessibility'],
    wikilinks: [
      'PROG 13. Frontend — Web Performance, Critical Path & Best Practices',
      'PROG 05. CSS — Master Architecture & Modern Styling Guide'
    ],
    customReplacements: [
      { pattern: /!\[.*?\]\([^)]*image1\.gif\)/g, replacement: '![Semantic HTML Layout](/uploads/prog-html-semantic.gif)' }
    ]
  }
];

// ─── Proceso Principal ───────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Iniciando procesamiento e importación del módulo Programación...');
  await initializeDatabase();
  const db = getPool();

  // 1. Confirmar/Crear Categoría "Programación"
  const [catRows] = await db.query('SELECT id, name FROM knowledge_categories WHERE name = ?', ['Programación']);
  let categoryId;
  if (catRows.length > 0) {
    categoryId = catRows[0].id;
    console.log(`📁 Categoría existente confirmada: "${catRows[0].name}" (ID ${categoryId})`);
  } else {
    const [insCat] = await db.query(
      'INSERT INTO knowledge_categories (user_id, area_id, name, description, sort_order) VALUES (?, ?, ?, ?, ?)',
      [USER_ID, AREA_ID, 'Programación', 'Desarrollo de software, arquitecturas frontend/backend, patrones y buenas prácticas', 1]
    );
    categoryId = insCat.insertId;
    console.log(`📁 Categoría creada: "Programación" (ID ${categoryId})`);
  }

  // 2. Sincronizar Tags
  const tagMap = new Map();
  for (const t of ALL_TAGS) {
    const [existing] = await db.query('SELECT id FROM knowledge_tags WHERE user_id = ? AND name = ?', [USER_ID, t.name]);
    if (existing.length > 0) {
      tagMap.set(t.name, existing[0].id);
    } else {
      const [res] = await db.query(
        'INSERT INTO knowledge_tags (user_id, name, color) VALUES (?, ?, ?)',
        [USER_ID, t.name, t.color]
      );
      tagMap.set(t.name, res.insertId);
    }
  }
  console.log(`🏷️ ${tagMap.size} tags listos para Programación.`);

  // 3. Preparar todas las notas
  const allNotesToProcess = [];

  for (const spec of noteSpecs) {
    let finalContent = '';
    if (spec.isHub) {
      finalContent = spec.getContent();
    } else {
      const fullPath = path.join(progSourceDir, spec.srcRel);
      if (!fs.existsSync(fullPath)) {
        console.warn(`⚠️ Archivo fuente no encontrado: ${fullPath}`);
        continue;
      }
      let raw = fs.readFileSync(fullPath, 'utf8');
      if (spec.enhanceContent) {
        raw = spec.enhanceContent(raw);
      }
      finalContent = cleanNotionMarkdown(raw, spec.title, spec.wikilinks, spec.customReplacements);
    }

    allNotesToProcess.push({
      title: spec.title,
      filename: spec.filename,
      content: finalContent,
      tags: spec.tags,
      isHub: !!spec.isHub
    });
  }

  console.log(`📚 Total de notas listas para sincronizar: ${allNotesToProcess.length}`);

  const noteIdMap = new Map();

  // 4. Guardar archivos limpios en disco e insertar/actualizar en MySQL
  for (const item of allNotesToProcess) {
    const outPath = path.join(optimizedDir, item.filename);
    fs.writeFileSync(outPath, item.content, 'utf8');

    const [existing] = await db.query(
      'SELECT id FROM knowledge_notes WHERE user_id = ? AND title = ?',
      [USER_ID, item.title]
    );

    let noteId;
    if (existing.length > 0) {
      noteId = existing[0].id;
      await db.query(
        `UPDATE knowledge_notes 
         SET content = ?, primary_category_id = ?, updated_at = NOW() 
         WHERE id = ?`,
        [item.content, categoryId, noteId]
      );
      console.log(`🔄 Nota actualizada: "${item.title}" (ID ${noteId})`);
    } else {
      const [ins] = await db.query(
        `INSERT INTO knowledge_notes 
         (user_id, title, content, content_format, primary_category_id, note_type, status, is_favorite, pinned)
         VALUES (?, ?, ?, 'markdown', ?, 'permanent', 'active', ?, ?)`,
        [USER_ID, item.title, item.content, categoryId, item.isHub ? 1 : 0, item.isHub ? 1 : 0]
      );
      noteId = ins.insertId;
      console.log(`📝 Nota creada: "${item.title}" (ID ${noteId})`);
    }

    noteIdMap.set(item.title, noteId);

    // Asociar a Área 1 (Programming)
    await db.query('DELETE FROM knowledge_note_areas WHERE note_id = ?', [noteId]);
    await db.query('INSERT IGNORE INTO knowledge_note_areas (note_id, area_id) VALUES (?, ?)', [noteId, AREA_ID]);

    // Asociar Tags
    await db.query('DELETE FROM knowledge_note_tags WHERE note_id = ?', [noteId]);
    for (const t of item.tags) {
      const tid = tagMap.get(t);
      if (tid) {
        await db.query('INSERT IGNORE INTO knowledge_note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tid]);
      }
    }
  }

  // 5. Generar Relaciones en knowledge_relations para el Knowledge Graph
  console.log('🕸️ Creando conexiones de red en el Knowledge Graph...');

  async function addRel(srcTitle, tgtTitle, type, desc) {
    const sId = noteIdMap.get(srcTitle);
    const tId = noteIdMap.get(tgtTitle);
    if (!sId || !tId || sId === tId) return;
    try {
      await db.query(
        `INSERT INTO knowledge_relations (user_id, source_note_id, target_note_id, relation_type, origin, description)
         VALUES (?, ?, ?, ?, 'manual', ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [USER_ID, sId, tId, type, desc]
      );
    } catch (e) {
      // Ignorar duplicados
    }
  }

  const hubTitle = 'PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base';

  // A. El Master Hub se conecta con TODAS las notas del módulo
  for (const item of allNotesToProcess) {
    if (!item.isHub) {
      await addRel(hubTitle, item.title, 'organizes', `Dominio de Programación: ${item.title}`);
    }
  }

  // B. Relaciones inter-modulares temáticas

  // Backend Cluster
  const authNote = 'PROG 01. Backend — Authentication & Token Strategies';
  const cachingNote = 'PROG 02. Backend — Caching Strategies & Architecture';
  const apiNote = 'PROG 03. Backend — API Architecture & Design Patterns';
  const webSecNote = 'PROG 04. Backend — Web Security & OWASP Defense';

  await addRel(authNote, webSecNote, 'relates_to', 'Autenticación y mitigación de OWASP Broken Authentication');
  await addRel(authNote, apiNote, 'implements', 'Esquema de autenticación Bearer token y Headers en APIs');
  await addRel(cachingNote, apiNote, 'optimizes', 'Estrategias de caché HTTP y reducción de carga en endpoints');
  await addRel(webSecNote, apiNote, 'protects', 'Headers CORS, SSL/TLS y directivas de seguridad en APIs');

  // CSS Cluster
  const cssHub = 'PROG 05. CSS — Master Architecture & Modern Styling Guide';
  const cssBasics = 'PROG 06. CSS — Core Fundamentals & Box Model';
  const cssBem = 'PROG 07. CSS — BEM Methodology & Modular Architecture';
  const cssFlex = 'PROG 08. CSS — Flexbox Layout System & Cheatsheet';
  const cssGrid = 'PROG 09. CSS — Grid Layout & 2D Page Architecture';
  const cssResp = 'PROG 10. CSS — Responsive Web Design & Viewports';
  const cssTips = 'PROG 11. CSS — Pro Tips, Modern Resets & Performance';

  await addRel(cssHub, cssBasics, 'contains', 'Fundamentos del modelo de caja y apilamiento');
  await addRel(cssHub, cssBem, 'contains', 'Metodología BEM para desacoplar especificidad');
  await addRel(cssHub, cssFlex, 'contains', 'Motor de diseño unidimensional 1D');
  await addRel(cssHub, cssGrid, 'contains', 'Motor de diseño bidimensional 2D');
  await addRel(cssHub, cssResp, 'contains', 'Estrategias de diseño responsive y viewports');
  await addRel(cssHub, cssTips, 'contains', 'Resets modernos y selectores de alto rendimiento');

  await addRel(cssFlex, cssGrid, 'complements', 'Flexbox para componentes 1D y Grid para maquetación 2D');
  await addRel(cssResp, cssFlex, 'applies_to', 'Distribución flexible en pantallas móviles');
  await addRel(cssResp, cssGrid, 'applies_to', 'Grillas adaptativas con minmax y auto-fit');
  await addRel(cssBem, cssTips, 'relates_to', 'Convenciones limpias y selectores no intrusivos');

  // Web & Frontend Fundamentals
  const htmlNote = 'PROG 18. HTML — Semantic Structure & SEO Foundations';
  const frontendPerf = 'PROG 13. Frontend — Web Performance, Critical Path & Best Practices';

  await addRel(htmlNote, cssHub, 'leads_to', 'El árbol DOM estructura el renderizado del CSSOM');
  await addRel(htmlNote, frontendPerf, 'optimizes', 'Marcado semántico y estructura para Core Web Vitals');
  await addRel(cssTips, frontendPerf, 'optimizes', 'CSS crítico y renderizado no bloqueante');
  await addRel(webSecNote, frontendPerf, 'protects', 'Políticas CSP y protección contra ataques XSS en frontend');

  // React Cluster
  const reactBasics = 'PROG 15. React — Core Fundamentals & Component Architecture';
  const reactContext = 'PROG 16. React — Context API & State Management';

  await addRel(reactBasics, reactContext, 'extends', 'Gestión de estado global para evitar Prop Drilling');
  await addRel(reactBasics, frontendPerf, 'applies_to', 'Virtual DOM y optimización de reconciliación');
  await addRel(reactContext, authNote, 'consumes', 'Consumo de AuthContext y tokens JWT en cliente');

  // Software Craftsmanship & Architecture
  const cleanCode = 'PROG 12. Clean Code — JavaScript Principles & Best Practices';
  const gentlemanBook = 'PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile';
  const refactoring = 'PROG 17. Refactoring — Eliminating Technical Debt & Code Smells';

  await addRel(cleanCode, refactoring, 'enables', 'El código limpio reduce la necesidad de refactorización masiva');
  await addRel(cleanCode, gentlemanBook, 'supports', 'Principios de diseño simple y artesanía de código');
  await addRel(gentlemanBook, refactoring, 'implements', 'Refactorización continua en el anillo técnico de Clean Agile');
  await addRel(gentlemanBook, reactBasics, 'architects', 'Separación de componentes contenedores y presentacionales');
  await addRel(gentlemanBook, apiNote, 'structures', 'Controladores, casos de uso y repositorios desacoplados');

  console.log(`\n🎉 PROCESO DE PROGRAMACIÓN COMPLETADO CON ÉXITO:`);
  console.log(`📁 19 Archivos Markdown limpios y optimizados guardados en: ${optimizedDir}`);
  console.log(`📚 19 Notas creadas/actualizadas en Knowledge Hub bajo categoría "Programación" (ID ${categoryId})`);
  console.log(`🕸️ Red densa de conexiones creada en el Knowledge Graph`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error fatal en importador de programación:', err);
  process.exit(1);
});

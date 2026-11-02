# PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base

> 🧭 **Centro de Comando de Arquitectura & Desarrollo de Software**
> 
> Base de conocimiento unificada que consolida estándares de industria, arquitecturas resilientes, diseño de interfaces modernas, seguridad web y patrones de software craftsmanship.

---

## 🗺️ Mapa de Dominios de Ingeniería

```
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
```

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
- [[PROG 06. CSS — Core Fundamentals & Box Model]]: Modelo de caja, `box-sizing: border-box`, contextos de apilamiento con `z-index` y control de overflow.
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]: Convenciones Block-Element-Modifier, aplanamiento de especificidad y diseño de componentes reutilizables.
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]: Distribución unidimensional (1D), ejes principal y transversal, alineación y cheatsheet visual.
- [[PROG 09. CSS — Grid Layout & 2D Page Architecture]]: Grillas bidimensionales (2D), áreas nominales, unidades fraccionarias `fr`, `repeat()` y `minmax()`.
- [[PROG 10. CSS — Responsive Web Design & Viewports]]: Configuración de viewports, estrategias Mobile-First vs Desktop-First y tipografía fluida con `clamp()`.
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]: Resets modernos, selectores avanzados (`:has()`, `:is()`, `:where()`) y aceleración por GPU.

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

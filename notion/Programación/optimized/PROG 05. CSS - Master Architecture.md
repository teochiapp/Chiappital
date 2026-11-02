# PROG 05. CSS — Master Architecture & Modern Styling Guide

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

> 🎨 **Arquitectura de Estilos para Aplicaciones Web Escalables**
>
> CSS moderno ha evolucionado de un lenguaje simple de presentación a un potente motor de diseño con soporte para layouts multidimensionales, custom properties (variables), directivas lógicas y renderizado acelerado por hardware.

---

## 🏛️ Pirámide de Especificidad en CSS

La cascada resuelve conflictos calculando un puntaje de especificidad de 4 componentes:

```
   (Inline)      (IDs)       (Classes, Attr, Pseudo-clases)    (Elements, Pseudo-elementos)
   [1, 0, 0, 0]  [0, 1, 0, 0]         [0, 0, 1, 0]                     [0, 0, 0, 1]
   style="..."    #header              .nav, [type="text"], :hover      div, h1, ::before
```

> ⚠️ **Regla de Oro:** Mantén la especificidad lo más baja y plana posible. Utiliza metodologías como [[PROG 07. CSS — BEM Methodology & Modular Architecture]] para evitar carreras de especificidad y nunca depender de `!important`.

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

- [[PROG 06. CSS — Core Fundamentals & Box Model]]: Modelo de caja, `box-sizing`, contextos de apilamiento y control de desbordamiento.
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]: Convención Block, Element, Modifier para componentes desacoplados.
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]: Diagramas completos de flex container, flex items y alineación en ejes.
- [[PROG 09. CSS — Grid Layout & 2D Page Architecture]]: Grillas complejas, áreas, fracciones `fr` y layouts dinámicos con `auto-fit`.
- [[PROG 10. CSS — Responsive Web Design & Viewports]]: Meta viewport, media queries, tipografía fluida y optimización multidispositivo.
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]: Resets modernos, selectores avanzados y técnicas de renderizado fluido.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 06. CSS — Core Fundamentals & Box Model]]
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]
- [[PROG 09. CSS — Grid Layout & 2D Page Architecture]]
- [[PROG 10. CSS — Responsive Web Design & Viewports]]
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]

# PROG 09. CSS — Grid Layout & 2D Page Architecture

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

### Grid

Similarly to flexbox, the source order of the grid items doesn’t matter. Your CSS can place them in any order, which makes it super easy to rearrange your grid with media queries. Imagine defining the layout of your entire page, and then completely rearranging it to accommodate a different screen width all with only a couple lines of CSS. Grid is one of the most powerful CSS modules ever introduced.

**Grid Container**

The element on which display: grid is applied. It’s the direct parent of all the grid items. In this example container is the grid container.

**Grid Item**

The children (i.e. *direct* descendants) of the grid container. Here the item elements are grid items, but sub-item isn’t.

**Grid Line**

The dividing lines that make up the structure of the grid. They can be either vertical (“column grid lines”) or horizontal (“row grid lines”) and reside on either side of a row or column. Here the yellow line is an example of a column grid line.

**Grid Cell**

The space between two adjacent row and two adjacent column grid lines. It’s a single “unit” of the grid. Here’s the grid cell between row grid lines 1 and 2, and column grid lines 2 and 3.

**grid-template-columns
grid-template-rows**

Defines the columns and rows of the grid with a space-separated list of values. The values represent the track size, and the space between them represents the grid line.

Values:

- **<track-size>** – can be a length, a percentage, or a fraction of the free space in the grid using the [fr](https://css-tricks.com/introduction-fr-css-unit/) unit ([more on this unit](https://www.digitalocean.com/community/tutorials/css-css-grid-layout-fr-unit?utm_medium=content_acq&utm_source=css-tricks&utm_campaign=&utm_content=awareness_bestsellers) over at DigitalOcean)
- **<line-name>** – an arbitrary name of your choosing

> You’ll likely end up using a lot of fractional units in CSS Grid, like 1fr. They essentially mean “portion of the remaining space”
>

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]
- [[PROG 08. CSS — Flexbox Layout System & Cheatsheet]]
- [[PROG 10. CSS — Responsive Web Design & Viewports]]

# PROG 06. CSS — Core Fundamentals & Box Model

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

Lo que no esta en el curso o que no sé

The z-index property specifies the stack order of an element.

The CSS overflow property controls what happens to content that is too big to fit into an area.

- visible - Default. The overflow is not clipped. The content renders outside the element's box
- hidden - The overflow is clipped, and the rest of the content will be invisible
- scroll - The overflow is clipped, and a scrollbar is added to see the rest of the content
- auto - Similar to scroll, but it adds scrollbars only when necessary

The child selector selects all elements that are the children of a specified element.

div > p {

background-color: yellow;

}

A pseudo-class is used to define a special state of an element.

a:visited {

color: #00FF00;

}

The opacity property is often used together with the :hover selector to change the opacity on mouse-over

The [attribute] selector is used to select elements with a specified attribute.

### Absolute Lengths

- cm centimeters
- mm millimeters
- in inches (1in = 96px = 2.54cm)
- px * pixels (1px = 1/96th of 1in)
- pt points (1pt = 1/72 of 1in)
- pc picas (1pc = 12 pt)

### Relative Lengths

- em Relative to the font-size of the element (2em means 2 times the size of the current font)
- ex Relative to the x-height of the current font (rarely used)
- ch Relative to width of the "0" (zero)
- rem Relative to font-size of the root element
- vw Relative to 1% of the width of the viewport*
- vh Relative to 1% of the height of the viewport*
- vmin Relative to 1% of viewport's* smaller dimension
- vmax Relative to 1% of viewport's* larger dimension
- % Relative to the parent element

## **What is Specificity?**

If there are two or more CSS rules that point to the same element, the selector with the highest specificity value will "win", and its style declaration will be applied to that HTML element.

Think of specificity as a score/rank that determines which style declaration is ultimately applied to an element.

Every CSS selector has its place in the specificity hierarchy.

There are four categories which define the specificity level of a selector:

1. **Inline styles** - Example: <h1 style="color: pink;">
2. **IDs** - Example: #navbar
3. **Classes, pseudo-classes, attribute selectors** - Example: .test, :hover, [href]
4. **Elements and pseudo-elements** - Example: h1, ::before

> The !important rule in CSS is used to add more importance to a property/value than normal.
> 
> 
> In fact, if you use the !important rule, it will override ALL previous styling rules for that specific property on that element!
> 

**Tip:** It is good to know about the !important rule. You might see it in some CSS source code. However, do not use it unless you absolutely have to.

The CSS math functions allow mathematical expressions to be used as property values. Here, we will explain the calc(), max() and min() functions.

### Display

![CSS Box Model Diagram](/uploads/prog-css-box-model.png)

In CSS, the display property determines how an element looks. It is also a crucial part of the presentation of you HTML code as it has a significant impact on layouts.

In fact, to use the modern Flexbox and Grid models, you need to use the display property before you get access to their various properties and values.

There are inline and block-level elements in CSS. The difference between the two is that inline elements don't take up an entire space – that is, they don't start on a new line – but block elements do.

When you set the display property of an element to none, the element is completely taken off the page and it doesn’t have an effect on the layout.

A **display: flex** gives you access to the Flex layout system, which simplifies how we design and layout our web pages.

A **display: grid** allows you to build layouts with the grid system, which is like an advanced form of flex.

A **display: inherit** makes the element inherit the display property of its parent

### Positioning

**static**

This is the **default** for every single page element. Different elements don’t have different default values for positioning, they all start out as static. Static doesn’t mean much; it just means that the element will flow into the page as it normally would. The only reason you would ever set an element to position: static; is to forcefully remove some positioning that got applied to an element outside of your control. This is fairly rare, as positioning doesn’t cascade.

**relative**

This type of positioning is probably the most confusing and misused. What it really means is “relative to itself”. If you set position: relative; on an element but no other positioning attributes (top, left, bottom or right), it will have no effect on it’s positioning at all, it will be exactly as it would be if you left it as position: static; But if you *do* give it some other positioning attribute, say, top: 10px;, it will shift its position 10 pixels *down* from where it would *normally* be.

it introduces the ability to use z-index on that element

it **limits the scope of absolutely positioned child elements**. Any element that is a child of the relatively positioned element can be absolutely positioned within that block.

**absolute**

This is a very powerful type of positioning that allows you to literally place any page element exactly where you want it. You use the positioning attributes top, left, bottom, and right to set the location. Remember that these values will be relative to the next parent element with relative (or absolute) positioning. The trade-off (and most important thing to remember) about absolute positioning is that these elements are **removed from the flow** of elements on the page

**fixed**

A fixed position element is positioned relative to the *viewport*, or the browser window itself. The viewport doesn’t change when the window is scrolled, so a fixed positioned element will stay right where it is when the page is scrolled.

**sticky**

Sticky positioning is really unique! A sticky element will just sit there like a static element, but as you scroll *past* it, if it’s parent element has room (usually: extra height) the sticky element will behave as if it’s fixed until that parent element is out of room.

### Box model

The CSS box model as a whole applies to block boxes and defines how the different parts of a box — margin, border, padding, and content — work together to create a box that you can see on a page. Inline boxes use just *some* of the behavior defined in the box model.

- **Content box**: The area where your content is displayed; size it using properties like [inline-size](https://developer.mozilla.org/en-US/docs/Web/CSS/inline-size) and [block-size](https://developer.mozilla.org/en-US/docs/Web/CSS/block-size) or [width](https://developer.mozilla.org/en-US/docs/Web/CSS/width) and [height](https://developer.mozilla.org/en-US/docs/Web/CSS/height).
- **Padding box**: The padding sits around the content as white space; size it using [padding](https://developer.mozilla.org/en-US/docs/Web/CSS/padding) and related properties.
- **Border box**: The border box wraps the content and any padding; size it using [border](https://developer.mozilla.org/en-US/docs/Web/CSS/border) and related properties.
- **Margin box**: The margin is the outermost layer, wrapping the content, padding, and border as whitespace between this box and other elements; size it using [margin](https://developer.mozilla.org/en-US/docs/Web/CSS/margin) and related properties.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]
- [[PROG 07. CSS — BEM Methodology & Modular Architecture]]

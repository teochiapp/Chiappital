# PROG 11. CSS — Pro Tips, Modern Resets & Performance

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

[https://github.com/AllThingsSmitty/css-protips](https://github.com/AllThingsSmitty/css-protips)

### Use a CSS Reset

CSS resets help enforce style consistency across different browsers with a clean slate for styling elements.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

Now elements will be stripped of margins and padding, and `box-sizing` lets you manage layouts with the CSS box model.

### Use `unset` Instead of Resetting All Properties

When resetting an element's properties, it's not necessary to reset each individual property:

```css
button {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  outline: none;
  padding: 0;
}
```

You can specify all of an element's properties using the `all` shorthand. Setting the value to `unset` changes an element's properties to their initial values:

```css
button {
  all: unset;
}
```

### Add `line-height` to `body`

You don't need to add `line-height` to each `<p>`, `<h*>`, *et al*. separately. Instead, add it to `body`:

```css
body {
  line-height: 1.5;
}
```

### Set `:focus` for Form Elements

Sighted keyboard users rely on focus to determine where keyboard events go in the page. Make focus for form elements stand out and consistent than a browser's default implementation:

```css
a:focus,
button:focus,
input:focus,
select:focus,
textarea:focus {
  box-shadow: none;
  outline: #000 dotted 2px;
  outline-offset: .05em;
}
```

### Vertically-Center Anything

No, it's not black magic, you really can center elements vertically. You can do this with flexbox...

```css
html,
body {
  height: 100%;
  margin: 0;
}

body {
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-flex;
  display: flex;
}
```

...and also with CSS Grid:

```css
body {
  display: grid;
  height**: 100vh;
  margin: 0;
  place-items: center center;**
}
```

More info: [https://css-tricks.com/centering-css-complete-guide/](https://css-tricks.com/centering-css-complete-guide/)

### Use the "Lobotomized Owl" Selector

It may have a strange name but using the universal selector (`*`) with the adjacent sibling selector (`+`) can provide a powerful CSS capability:

```css
* + * {
  margin-top: 1.5em;
}
```

In this example, all elements in the flow of the document that follow other elements will receive `margin-top: 1.5em`.

### Use `max-height` for Pure CSS Sliders

Implement CSS-only sliders using `max-height` with overflow hidden:

```css
.slider {
  max-height: 200px;
  overflow-y: hidden;
  width: 300px;
}

.slider:hover {
  max-height: 600px;
  overflow-y: scroll;
}
```

The element expands to the `max-height` value on hover and the slider displays as a result of the overflow.

### Style "Default" Links

Add a style for "default" links:

```css
a[href]:not([class]) {
  color: #008000;
  text-decoration: underline;
}
```

Now links that are inserted via a CMS, which don't usually have a `class` attribute, will have a distinction without generically affecting the cascade.

### Style Broken Images

Make broken images more aesthetically-pleasing with a little bit of CSS:

```css
img {
  display: block;
  font-family: sans-serif;
  font-weight: 300;
  height: auto;
  line-height: 2;
  position: relative;
  text-align: center;
  width: 100%;
}
```

Now add pseudo-elements rules to display a user message and URL reference of the broken image:

```css
img::before {
  content: "We're sorry, the image below is broken :(";
  display: block;
  margin-bottom: 10px;
}

img::after {
  content: "(url: " attr(src) ")";
  display: block;
  font-size: 12px;
}
```

### Use `rem` for Global Sizing; Use `em` for Local Sizing

After setting the base font size at the root (`html { font-size: 100%; }`), set the font size for textual elements to `em`:

```css
h2 {
  font-size: 2em;
}

p {
  font-size: 1em;
}
```

Then set the font-size for modules to `rem`:

```css
article {
  font-size: 1.25rem;
}

aside .module {
  font-size: .9rem;
}
```

Now each module becomes compartmentalized and easier to style, more maintainable, and flexible.

### Hide Autoplay Videos That Aren't Muted

This is a great trick for a custom user stylesheet. Avoid overloading a user with sound from a video that autoplays when the page is loaded. If the sound isn't muted, don't show the video:

```
video[autoplay]:not([muted]) {
  display: none;
}
```

Once again, we're taking advantage of using the [`:not()`](https://github.com/AllThingsSmitty/css-protips#use-not-to-applyunapply-borders-on-navigation) pseudo-class.

### Use `:root` for Flexible Type

The type font size in a responsive layout should be able to adjust with each viewport. You can calculate the font size based on the viewport height and width using `:root`:

```css
:root {
  font-size: calc(1vw + 1vh + .5vmin);
}
```

Now you can utilize the `root em` unit based on the value calculated by `:root`:

```css
body {
  font: 1rem/1.6 sans-serif;
}
```

### 

### Inherit `font` on Form Elements for a Better Mobile Experience

Some form controls do not inherit typographical styles by default. To avoid mobile browsers (iOS Safari, *et al*.) from zooming in on HTML form elements when a `<select>` drop-down is tapped, and to mitigate styling inconsistencies across browsers, set the `font` rule to `inherit`:

```css
input,
button,
select,
textarea {
  font: inherit;
}
```

Learn more in [MDN's guide to styling web forms](https://developer.mozilla.org/en-US/docs/Learn/Forms/Styling_web_forms).

### Set `display: none` on Line Breaks Used as Spacing

As [Harry Roberts pointed out](https://twitter.com/csswizardry/status/1170835532584235008), this can help prevent CMS users from using extra line breaks for spacing:

```css
br + br {
  display: none;
}
```

### Use `:empty` to Hide Empty HTML Elements

If you have HTML elements that are empty, i.e., the content has yet to be set either by a CMS or dynamically injected (e.g., `<p class="error-message"></p>`) and it's creating unwanted space on your layout, use the `:empty` pseudo-class to hide the element on the layout.

```
:empty {
  display: none;
}
```

**Note:** Keep in mind that elements with whitespace aren't considered empty, e.g., `<p class="error-message"> </p>`.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]
- [[PROG 13. Frontend — Web Performance, Critical Path & Best Practices]]

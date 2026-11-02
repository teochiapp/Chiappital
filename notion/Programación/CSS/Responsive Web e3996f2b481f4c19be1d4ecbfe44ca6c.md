# Responsive Web

It is called responsive web design when you use CSS and HTML to resize, hide, shrink, enlarge, or move the content to make it look good on any screen.

**What is The Viewport?**

The viewport is the user's visible area of a web page.

The viewport varies with the device, and will be smaller on a mobile phone than on a computer screen.

HTML5 introduced a method to let web designers take control over the viewport

<meta name="viewport" content="width=device-width, initial-scale=1.0">

The width=device-width part sets the width of the page to follow the screen-width of the device (which will vary depending on the device).

The initial-scale=1.0 part sets the initial zoom level when the page is first loaded by the browser.

Using a grid-view is very helpful when designing web pages. It makes it easier to place elements on the page.

## **What is a Media Query?**

Media query is a CSS technique introduced in CSS3.

It uses the @media rule to include a block of CSS properties only if a certain condition is true.

Add a Breakpoint

Earlier in this tutorial we made a web page with rows and columns, and it was responsive, but it did not look good on a small screen.

Media queries can help with that. We can add a breakpoint where certain parts of the design will behave differently on each side of the breakpoint.

## **Add a Breakpoint**

Earlier in this tutorial we made a web page with rows and columns, and it was responsive, but it did not look good on a small screen.

Media queries can help with that. We can add a breakpoint where certain parts of the design will behave differently on each side of the breakpoint.

## **Always Design for Mobile First**

Mobile First means designing for mobile before designing for desktop or any other device (This will make the page display faster on smaller devices).

You can use Media querie for changing font size or hide thing also.

## **Grid options**

Bootstrap’s grid system can adapt across all six default breakpoints, and any breakpoints you customize. The six default grid tiers are as follow:

- Extra small (xs) thin mobile
- Small (sm): mobile
- Medium (md): Tablet devices
- Large (lg): large screen resolution
- Extra large (xl): extra-large screen resolution
- Extra extra large (xxl): double extra-large screen resolution

As noted above, each of these breakpoints have their own container, unique class prefix, and modifiers. Here’s how the grid changes across these breakpoints:

| **xs**<576px | **sm**≥576px | **md**≥768px | **lg**≥992px | **xl**≥1200px | **xxl**≥1400px |
| --- | --- | --- | --- | --- | --- |

## **Key responsive web design terms**

- [fluid grids](https://university.webflow.com/lesson/grid-2-0) — a grid is an element with areas in columns and rows that can have content added. A fluid grid can be set to auto-fit or be set manually to adjust across breakpoints.
- [flexible images](https://university.webflow.com/lesson/responsive-images) — responsive images that can be served to the browser in different sizes depending on the size of the image in the layout and the resolution of the viewer’s screen. Ensuring images are responsive will avoid having pixelated too-small images or images that are unnecessarily large and slow down site loading.
- [breakpoints](https://university.webflow.com/lesson/intro-to-breakpoints) — the points in screen size or orientation (informed by media queries) where a website is triggered to adjust its layout.
- media queries — the specific CSS function that receives information about size from the viewer’s device to trigger the breakpoints in the design.
- viewport — the visible area on the user’s device where content can be seen.
- [overflow](https://university.webflow.com/lesson/overflow-hidden) — elements in your design that exist outside the viewport or are too large for their container.
- [fixed sizing](https://university.webflow.com/lesson/size-settings-width-height) — sizing that is always the same no matter the other factors affecting your site or layout (pixels). Fixed sizing is not responsive.
- [relative sizing](https://university.webflow.com/lesson/size-settings-width-height) — sizing that changes in response to another element in your layout or the user’s device (%, em or rem, character height, viewport height, or viewport width). Relative sizing is responsive.
- mobile-first — a design strategy of designing the most restricted mobile design first before designing for larger devices, in reverse of the previously assumed process of designing for desktop and scaling down from there. Its intention is to push designers to prioritize successful, accessible mobile designs.
- [hamburger menu](https://university.webflow.com/lesson/navbar-menu-button) — a menu button that enables a drop-down function for navbar links that helps save space in restricted designs. Named for its shape consisting of stacked lines whose appearance resembles ... a hamburger.

### **Responsive vs. adaptive design**

[Adaptive design](https://webflow.com/blog/adaptive-vs-responsive-design) is creating an independent, lighter, and more streamlined mobile-optimized version of a website. Its better for smaller and medium companies.

![](Responsive%20Web/image9.jpeg)

### **Relative length units**

For responsive design, use viewport-relative units like vh or vw or font-relative units like em or rem.

![Untitled](Responsive%20Web/Untitled.png)

![Untitled](Responsive%20Web/Untitled%201.png)
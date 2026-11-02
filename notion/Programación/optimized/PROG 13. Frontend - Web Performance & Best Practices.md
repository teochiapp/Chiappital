# PROG 13. Frontend — Web Performance, Critical Path & Best Practices

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

## High Priority

### **Avoid iframes**

Iframes are not only bad for performance, but also for accessibility and usability. Iframes are also not indexed by search engines.

### **Minify CSS and JS**

> All CSS files and JS are minified, comments, white spaces and new lines are removed from production files.
> 

The content is loaded faster and less data is sent to the client. It’s important to always minify CSS files in production. It is beneficial for the user as it is for any business who wants to lower bandwidth costs and lower resource usage.

### **Non-Blocking CSS**

CSS files can block the page load and delay the rendering of your page. Using `preload` can actually load the CSS files before the browser starts showing the content of the page.

You need to add the `rel` attribute with the preload value and add `as="style"` on the `<link>` element.

### **Inline Critical CSS**

> The CSS critical (or “above the fold”) collects all the CSS used to render the visible portion of the page. It is embedded before your principal CSS call and between <style></style> in a single line (minified if possible).
> 

Inlining critical CSS help to speed up the rendering of the web pages reducing the number of requests to the server.

### **Avoid Inline CSS**

> Avoid using embed or inline CSS inside your <body>
> 

One of the first reasons is because it’s a good practice to separate content from design. It also helps you have a more maintainable code and keep your site accessible. But regarding performance, it’s simply because it decreases the file size of your HTML pages and the load time.

Always use external stylesheets or embed CSS in your **`<head>`** (and follow the others CSS performance rules)

### **Stylesheet Complexity**

> Analyzing your stylesheets can help you to flag issues, redundancies and duplicate CSS selectors.
> 

Sometimes you may have redundancies or validation errors in your CSS, analysing your CSS files and removing these complexities can help you to speed up your CSS files (because your browser will read them faster).

Your CSS should be organized

### **Images Optimization**

> Your images are optimized, compressed without direct impact to the end user.
> 

Optimized images load faster in your browser and consume less data.

- Try using CSS3 effects when it’s possible (instead of a small image)
- When it’s possible, use fonts instead of text encoded in your images
- Use SVG
- Use a tool and specify a level compression under 85.

### **Image Format**

> Choose your image format appropriately
> 

To ensure that your images don’t slow your website, choose the format that will correspond to your image. If it’s a photo, JPEG is most of the time more appropriate than PNG or GIF. But don’t forget to look a the nex-gen formats which can reduce the size of your files. Each image format has pros and cons, it’s important to know these to make the best choice possible.

Use [**Lighthouse**](https://developers.google.com/web/tools/lighthouse/) to identify which images can eventually use next-gen formats (like JPEG 2000m JPEG XR or WebP). Compare different formats, sometimes using PNG8 is better than PNG16, sometimes it’s not.

### **Non-Blocking JavaScript**

JavaScript files are loaded asynchronously using async or deferred using defer attribute.

```
<!-- Defer Attribute --><scriptdefersrc="foo.js"></script>
<!-- Async Attribute --><scriptasyncsrc="foo.js"></script>
```

JavaScript blocks the normal parsing of the HTML document, so when the parser reaches a **`<script>`** tag (particularly is inside the **`<head>`**), it stops to fetch and run it. Adding async or defer are highly recommended if your scripts are placed in the top of your page but less valuable if just before your **`</body>`** tag. But it’s a good practice to always use these attributes to avoid any performance issue.

- Add **`async`** (if the script doesn’t rely on other scripts) or **`defer`** (if the script relies upon or is relied upon by an async script) as an attribute to your script tag.

### **Use HTTPs**

HTTPS is not only for ecommerce websites, but for all websites that are exchanging data. Data shared by a user or data shared to an external entity. Modern browsers today limit functionalities for sites that are not secure. For example: geolocation, push notifications and service workers don’t work if your instance is not using HTTPS. And today is much more easy to setup a project with an SSL certificate than it was before

### **Page weight below 1500**

> Reduce the size of your page + resources as much as you can.
> 

Ideally you should try to target < 500 KB but the state of web shows that the median of Kilobytes is around 1500 KB (even on mobile). Depending on your target users, network connection, devices, it’s important to reduce as much as possible your total Kilobytes to have the best user experience possible.

### **Page Load Time**

> Reduce as much as possible your page load times to quickly deliver your content to your users.
> 

Faster your website or app is, less you have probability of bounce increases, in other terms you have less chances to lose your user or future client. Enough researches on the subject prove that point.

Use online tools like [**Page Speed Insights**](https://developers.google.com/speed/pagespeed/insights/) or [**WebPageTest**](https://www.webpagetest.org/) to analyze what could be slowing you down and use the Front-End Performance Checklist to improve your load times.

### **Keep The Time to First Byte < 1.3s**

Reduce as much as you can the time your browser waits before receiving data

### **Minimize HTTP Requests**

> Always ensure that every file requested are essential for your website or application.
> 

### **Use same Protocol**

Avoid having your website serving files coming from source using HTTP on your website which is using HTTPS for example. If your website is using HTTPS, external files should come from the same protocol.

### **Serve Reachable Files**

> Avoid requesting unreachable files (404)
> 

404 request can slow down the performance of your website and negatively impact the user experience. Additionally, they can also cause search engines to crawl and index non-existent pages, which can negatively impact your search engine rankings. To avoid 404 requests, ensure that all links on your website are valid and that any broken links are fixed promptly.

### **HTTP Caching**

Set HTTP headers to avoid expensive number of roundtrips between your browser and the server.

### **Enable Compression**

Use a compression method such as Gzip or Brotli to reduce the size of your JavaScript files. With a smaller sizes file, users will be able to download the asset faster, resulting in improved performance.

## Medium Priority

### **Minify HTML**

> The HTML code is minified, comments, white spaces and new lines are removed from production files.
> 

Removing all unnecessary spaces, comments and attributes will reduce the size of your HTML and speed up your site’s page load times and obviously lighten the download for your user. You can use plugins for this

### **Use CDN**

Use a CDN to serve your static assets. This will reduce the load on your server and improve the performance of your site.

CDN significa Content Delivery Network o Red de Distribución de Contenidos.

Se trata de conjuntos (por lo general bastante grandes) de servidores sincronizados entre sí y preparados para servir contenido estático desde diversos puntos del planeta.

Su objetivo principal es el de disminuir el tiempo de carga de una página web (Algo que siempre viene bien).

### **Prefer Vector Images**

> Prefer using vector image rather than bitmap images (when possible).
> 

Vector images (SVG) tend to be smaller than images and SVG’s are responsive and scale perfectly. These images can be animated and modified by CSS.

### **Image Dimensions**

> Set width and height attributes on <img> if the final rendered image size is known.
> 

If height and width are set, the space required for the image is reserved when the page is loaded. However, without these attributes, the browser does not know the size of the image, and cannot reserve the appropriate space to it. The effect will be that the page layout will change during loading (while the images load).

### **Avoid Base64 Images**

Using Base64 encoded images in your frontend can have several drawbacks.

Instead of using Base64 encoded images, it is generally recommended to use binary image files and reference them using an img tag in HTML, with a standard src attribute. This allows the browser to cache the image and use it for subsequent page loads, resulting in faster loading times and better user experience.

### **Lazy Loading**

> Offscreen images are loaded lazily (A noscript fallback is always provided).
> 

It will improve the response time of the current page and then avoid loading unnecessary images that the user may not need.

[At last check](http://httparchive.org/interesting.php?a=All&l=Dec%2015%202016&s=Top1000) (Dec 2016), images make up over 50% of the top 1000 web sites’ total size, and dissecting your own site probably yields similar numbers. When it comes to dramatically improving page loading times then (which has countless benefits, from decreased bounce rates, improved conversations, to higher Google rankings), it makes sense to start with your site’s images first. 

The idea is to asynchronously or even conditionally load images on a page only when they appear in the browser’s viewport, so some images are not loaded at all if the user doesn’t get that far on the page.

### **Responsive Images**

> Ensure to serve images that are close to your display size.
> 

Small devices don’t need images bigger than their viewport. It’s recommended to have multiple versions of one image on different sizes.

- Create different image sizes for the devices you want to target
- Use **`srcset`** and **`picture`** to deliver multiple variants of each image.

There are two distinct problems that we can solve:

- **Art direction**: The problem whereby you want to serve cropped images for different layouts — for example a landscape image showing a full scene for a desktop layout, and a portrait image showing the main subject zoomed in for a mobile layout. You can solve this problem using the [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) element.
- **Resolution switching**: The problem whereby you want to serve smaller image files to narrow-screen devices, as they don't need huge images like desktop displays do — and to serve different resolution images to high density/low density screens. You can solve this problem using [vector graphics](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Adding_vector_graphics_to_the_Web) (SVG images) and the [`srcset`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#srcset) with [`sizes`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#sizes) attributes.

### **Avoid Inline JavaScript**

> Avoid having multiple JavaScript codes embedded in the middle of your body. Regroup your JavaScript code inside external files or eventually in the <head> or at the end of your page (before </body>).
> 

Placing JavaScript embedded code directly in your **`<body>`** can slow down your page because it loads while the DOM is being built. The best option is to use external files with async or defer to avoid blocking the DOM. Another option is to place some scripts inside your **`<head>`**. Most of the time analytics code or small script that need to load before the DOM gets to main processing.

Ensure that all your files are loaded using **`async`** or **`defer`** and decide wisely the code that you will need to inject in your **`<head>`**.

### **Dependency Updates**

> All JavaScript libraries used in your project are necessary (prefer Vanilla JavaScript for simple functionalities), updated to their latest version and don’t overwhelm your JavaScript with unnecessary methods.
> 

Most of the time, new versions come with optimization and security fix. You should use the most optimized code to speed up your project and ensure that you’ll not slow down your website or app without outdated plugin.

If your project use NPM packages, [**npm-check**](https://www.npmjs.com/package/npm-check) is a pretty interesting library to upgrade / update your libraries. [**Greenkeeper**](https://greenkeeper.io/) can automatically look for your dependencies and suggest an update every time a new version is out.

### **JavaScript Performance**

> Check for performance problems in your JavaScript files (and CSS too)
> 

JavaScript complexity can slow down runtime performance. Identifying these possible issues are essential to offer the smoothest user experience.

Use the Timeline tool in the Chrome Developer Tool to evaluate scripts events and found the one that may take too much time.

### **Use Service Workers**

For coaching / performing heavy tasks

You are using Service Workers in your PWA to cache data or execute possible heavy tasks without impacting the user experience of your application.

### **Cookie Size**

> If you are using cookies, be sure each cookie doesn’t exceed 4096 bytes and your domain name doesn’t have more than 20 cookies.
> 

Cookies are exchanged in the HTTP headers between web servers and browsers. It’s important to keep the size of cookies as low as possible to minimize the impact on the user’s response time.

## Low Priority

### **Preload URLs**

> Popular browsers can use directive on <link> tag and "rel" attribute with certain keywords to pre-load specific URLs
> 

Prefetching allows a browser to silently fetch the necessary resources needed to display content that a user might access in the near future. The browser is able to store these resources in its cache and speed up the way web pages load when they are using different domains for page resources. When a web page has finished loading and the idle time has passed, the browser begins downloading other resources. When a user go in a particular link (already prefetched), the content will be instantly served.

### **CSS Concatenation**

> CSS files are concatenated in a single file (Not always valid for HTTP/2)
> 

If you are still using HTTP/1, you may need to still concatenate your files, it’s less true if your server use HTTP/2 (tests should be made).

- Use online tool or any plugin before or during your build or your deployment to concatenate your files.
- Ensure, of course, that concatenation does not break your project

### **Remove Unused CSS**

Removing unused CSS selectors can reduce the size of your files and then speed up the load of your assets.

Always check if the framework CSS you want to use don’t already has a reset / normalize code included. Sometimes you may not need everything that is inside your reset / normalize file.

### **Use WOFF 2.0 Web Font**

According to Google, the WOFF 2.0 Web Font compression format offers 30% average gain over WOFF 1.0. It’s then good to use WOFF 2.0, WOFF 1.0 as a fallback and TTF.

Check before buying your new font that the provider gives you the WOFF2 format. If you are using a free font, you can always use Font Squirrel to generate all the formats you need.

### **Preconnect on Fonts**

```html
<link rel="preconnect"href="https://fonts.gstatic.com"crossorigin />
```

When you arrived on a website, your device needs to find out where your site lives and which server it needs to connect with. Your browser had to contact a DNS server and wait for the lookup complete before fetching the resource (fonts, CSS files…). Prefetches and preconnects allow the browser to lookup the DNS information and start establishing a TCP connection to the server hosting the font file. This provides a performance boost because by the time the browser gets around to parsing the css file with the font information and discovering it needs to request a font file from the server, it will already have pre-resolved the DNS information and have an open connection to the server ready in its connection pool.

- Before prefetching your webfonts, use webpagetest to evaluate your website
- Look for teal colored DNS lookups and note the host that are being requested
- Prefetch your webfonts in your **`<head>`** and add eventually these hostnames that you should prefetch too

### **Keep Web Font Size Under 300kb**

Web fonts are a great way to add style to your website. However, they can also be a major performance bottleneck. The more fonts you use, the more time it takes for the browser to download and render the page. This can lead to a poor user experience and a high bounce rate.

Webfont sizes shouldn’t exceed 300kb (all variants included) and are optimized for performance.

### **Prevent Flash Text**

> Avoid transparent text until the Webfont is loaded
> 

### **Check Dependency Size**

> Ensure to use wisely external libraries, most of the time, you can use a lighter library for a same functionality.
> 

You may be tempted to use one of the 745 000 packages you can find on npm, but you need to choose the best package for your needs. For example, MomentJS is an awesome library but with a lot of methods you may never use, that’s why Day.js was created. It’s just 2kB vs 16.4kB gz for Moment.

Always compare and choose the best and lighter library for your needs. You can also use tools like [**npm trends**](http://www.npmtrends.com/) to compare NPM package downloads counts or [**Bundlephobia**](https://bundlephobia.com/) to know the size of your dependencies.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 11. CSS — Pro Tips, Modern Resets & Performance]]
- [[PROG 04. Backend — Web Security & OWASP Defense]]
- [[PROG 18. HTML — Semantic Structure & SEO Foundations]]

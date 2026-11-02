# PROG 18. HTML — Semantic Structure & SEO Foundations

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

**Semantic HTML cheat sheet**

[Bootstrap Layout Examples](https://getbootstrap.com/docs/5.2/examples/)

Metadata Cheatsheet

![Semantic HTML Layout](/uploads/prog-html-semantic.gif)

## Basics of SEO

Search Engine Optimization is the technique used to optimize your website for better rankings on search engines such as Google, Bing etc.

Google search engine’s goal is to find the most useful results for the searches their users perform. Google constantly improves in doing so.

The point is that short term tricks sometimes could get you good results in terms of SEO but might not work after an arbitrary algorithm change.

**The most important thing in getting a good rank in Google is to make your website engaging, useful, and original. Your role as a developer is to ensure it is accessible and smooth for users and correctly exposed to Google bots.**

Be Data Driven

Short pipelines, release cycles and good analytics would ensure that the people who are responsible for content can test different options to see how they work.

For example, Google uses the <title> tag as the title displayed in search results. With short pipelines, and good analytics, content creators can test different titles more frequently to see how users respond to each title.

- [**<title>**](http://support.google.com/webmasters/answer/7451184#uniquepagetitles) and [**<meta name=”description”>**](http://support.google.com/webmasters/answer/7451184#descriptionmeta) are the tags controlling how your web page is displayed on Google’s result pages.
- **HTML tags** like [header tags (**h1, h2**)](https://support.google.com/webmasters/answer/7451184#headingtags) and **HTML attributes** like the [**alt attribute on <img> tags**](https://support.google.com/webmasters/answer/7451184#html-images), would help to create a structure to your web page so crawlers can interpret your content better.
- [**Structured Data**](https://developers.google.com/search/docs/guides/intro-structured-data) exposes information from your page like rank, location, opening hours, and prices to appear on Google search pages. The more information appears on the search page, the [higher the chance of a web page to be clicked](https://www.searchenginejournal.com/how-important-is-structured-data/).
- Make the web site [**mobile** friendly](https://search.google.com/test/mobile-friendly).
- Use the [**HTTPS** protocol](https://support.google.com/webmasters/answer/6073543).
- Make your website [**accessible** to people with disabilities](https://moz.com/blog/accessibility-seo-1). Not only would your website be accessible to more people, Google would also reward you with a higher rank.
- Use [logical and meaningful **site hierarchy**](http://support.google.com/webmasters/answer/7451184#hierarchy)
    
    example.com/RunningShoes/Womens
    
    not
    
    example.com/123123/123123
    
- Watch your [**<a href>** **links**](https://support.google.com/webmasters/answer/7451184#uselinkswisely)
    
    * Each link has to have meaningful text.
    
    * Tell google the [nature of your links to external websites](https://support.google.com/webmasters/answer/96569) using extra attributes on the <a> tag. For example, **rel=”nofollow”** is used to let Google know you are not associated with the website you link to.
    
    * Make sure every page you want Google to crawl is [linked with an <a href>](https://support.google.com/webmasters/answer/9112205) from the homepage (possibly through more then one link).
    
- Make sure [your **content is not duplicated**](https://support.google.com/webmasters/answer/66359) between different versions so they won’t compete with each other:
    
    * Use **301 redirects** if you’ve restructured your site so both versions won’t get indexed separately and compete with each other.
    
    * Stick to **one version** of a website’s link:
    
    **http://www.example.com/page/** or **http://www.example.com/page** or **http://www.example.com/page/index.html**
    
    * Use [**<meta rel=”canonical”>**](https://yoast.com/rel-canonical/) tag to indicate different pages and URLs are holding the same content.
    
- [**Localization**Use the hreflang](https://www.pageonepower.com/linkarati/boost-seo-website-localization) meta tag to tells Google that a web page has different versions in different languages.
- Make your website fast to score high on “**Google PageSpeed Insights**”.

### **8 Must-Know SEO Best Practices For Developers**

1. Keep Your Code Clean: Keep it simple
2. Keep Load Times Fast
3. Use the Correct Redirects
4. Add a Sitemap

In simple terms, it’s a list of a website’s URLs.

### Make Sure the Site Works on Mobile

[Mobile devices account for 54.8 percent of website traffic](https://www.statista.com/statistics/277125/share-of-website-traffic-coming-from-mobile-devices/#:~:text=Mobile%20accounts%20for%20approximately%20half,since%20the%20beginning%20of%202017.)

1. 6. Check the Robots.txt File
2. 7. Ensure Follow/No Follow Links Are Used Appropriately

Follow links, also called do-follow links, are backlinks where the person linking to the page doesn’t edit the HTML to ensure Google doesn’t associate their site with another

### 8. Understand and Implement Structured Data

Developers already know how to format a page so that all parts of it flow well and can be read by both human and search engine searchers.

## HTML Best Practices

**Use only one <h1> element for one code sheet**

**Do not skip heading levels in HTML (H1 to H6)**

**Use <figure> y <figcaption> to add captions to your images in HTML**

**Avoid using <b> and <i> to bold and italicize texts on a web page**

**Don't place block-level element within inline elements**

## Accesibility

Not important for now

# Forms and validations

Before submitting data to the server, it is important to ensure all required form controls are filled out, in the correct format. This is called client-side form validation, and helps ensure data submitted matches the requirements set forth in the various form controls.

- We want to get the right data, in the right format. Our applications won't work properly if our users' data is stored in the wrong format, is incorrect, or is omitted altogether.
- We want to protect our users' data. Forcing our users to enter secure passwords makes it easier to protect their account information.
- We want to protect ourselves. There are many ways that malicious users can misuse unprotected forms to damage the application

> Built-in form html validation has better performance than JavaScript, but it is not as customizable as JavaScript validation.
> 
- [**required**](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/required): Specifies whether a form field needs to be filled in before the form can be submitted.
- [**minlength**](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/minlength) and [maxlength](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength): Specifies the minimum and maximum length of textual data (strings).
- [**min](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/min) and [max](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/max):** Specifies the minimum and maximum values of numerical input types.
- [**type**](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#input_types): Specifies whether the data needs to be a number, an email address, or some other specific preset type.
- [**pattern**](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/pattern): Specifies a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions) that defines a pattern the entered data needs to follow.

> Client-side form validation sometimes requires JavaScript if you want to customize styling and error messages, but it always requires you to think carefully about the user. Always remember to help your users correct the data they provide. To that end, be sure to:
> 
- Display explicit error messages.
- Be permissive about the input format.
- Point out exactly where the error occurs, especially on large forms.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 13. Frontend — Web Performance, Critical Path & Best Practices]]
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]

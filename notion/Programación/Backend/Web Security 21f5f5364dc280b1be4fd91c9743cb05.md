# Web Security

Web security involves protecting web applications from threats and vulnerabilities to ensure data confidentiality, integrity, and availability. Key practices include strong authentication and authorization mechanisms, using encryption (e.g., SSL/TLS) for secure data transmission, and validating user inputs to prevent attacks like SQL injection and cross-site scripting.

### HTTPS

HTTPS (Hypertext Transfer Protocol Secure) is an extension of HTTP designed to secure data transmission between a client (e.g., browser) and a server. It uses encryption through SSL/TLS protocols to ensure data confidentiality, integrity, and authenticity. This prevents sensitive information, like login credentials or payment details, from being intercepted or tampered with by attackers. HTTPS is essential for securing web applications and has become a standard for most websites

### Top 10 Security Risks

**Broken Access Control**

Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of all data or performing a business function outside the user's limits

 **Cryptographic Failures**

The first thing is to determine the protection needs of data in transit and at rest. For example, passwords, credit card numbers, health records, personal information, and business secrets require extra protection, mainly if that data falls under privacy laws, e.g., EU's General Data Protection Regulation (GDPR), or regulations, e.g., financial data protection such as PCI Data Security Standard (PCI DSS). 

Injection

- User-supplied data is not validated, filtered, or sanitized by the application.
- Dynamic queries or non-parameterized calls without context-aware escaping are used directly in the interpreter.
- Hostile data is used within object-relational mapping (ORM) search parameters to extract additional, sensitive records.
- Hostile data is directly used or concatenated. The SQL or command contains the structure and malicious data in dynamic queries, commands, or stored procedures.

Insecure Desing

Security Misconfiguration

**Vulnerable and Outdated Components**

- If you do not know the versions of all components you use (both client-side and server-side). This includes components you directly use as well as nested dependencies.
- If the software is vulnerable, unsupported, or out of date. This includes the OS, web/application server, database management system (DBMS), applications, APIs and all components, runtime environments, and libraries.

**Identification and Authentication Failures**

Confirmation of the user's identity, authentication, and session management is critical to protect against authentication-related attacks.

**Software and Data Integrity Failures**

Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations. An example of this is where an application relies upon plugins, libraries, or modules from untrusted sources, repositories, and content delivery networks (CDNs). An insecure CI/CD pipeline can introduce the potential for unauthorized access, malicious code, or system compromise.

**Security Logging and Monitoring Failures**

**Server-Side Request Forgery (SSRF)**

SSRF flaws occur whenever a web application is fetching a remote resource without validating the user-supplied URL. It allows an attacker to coerce the application to send a crafted request to an unexpected destination, even when protected by a firewall, VPN, or another type of network access control list (ACL).

### CORS

Cross-Origin Resource Sharing (CORS) is a security mechanism implemented by web browsers to control access to resources (like APIs or fonts) on a web page from a different domain than the one serving the web page. It extends and adds flexibility to the Same-Origin Policy, allowing servers to specify who can access their resources. CORS works through a system of HTTP headers, where browsers send a preflight request to the server hosting the cross-origin resource, and the server responds with headers indicating whether the actual request is allowed. 

If a website is hosted on `localhost:8000` and its JavaScript code attempts to send a request to a server running on `localhost:9000`, the request will fail due to the [**same-origin policy**](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) enforced by browsers. This policy restricts how a document or script loaded from one origin can interact with resources from another origin, preventing unauthorized cross-origin requests by default.

- Requests made to the same origin are allowed by the browser.
- Requests to a different origin (known as cross-origin requests) are blocked by default, resulting in a CORS error.

So, what is CORS? CORS (Cross-Origin Resource Sharing) is an HTTP header based mechanism where servers can tell browsers which origins are allowed to interact with its resources.

```jsx
var express = require('express');
var cors = require('cors');
var app = express();

cors({ origin: 'http://localhost:8000' });

app.get('/api', function (req, res, next) {
  res.json({ msg: 'success' });
});

app.listen(9000, function () {
  console.log('CORS-enabled for localhost:8000');
});
```

### SSL

Secure Sockets Layer (SSL) and Transport Layer Security (TLS) are cryptographic protocols used to provide security in internet communications. These protocols encrypt the data that is transmitted over the web, so anyone who tries to intercept packets will not be able to interpret the data. One difference that is important to know is that SSL is now deprecated due to security flaws, and most modern web browsers no longer support it. But TLS is still secure and widely supported, so preferably use TLS.

![{AD4FF334-97DE-4340-98FF-B4C78338F254}.png](Web%20Security/AD4FF334-97DE-4340-98FF-B4C78338F254.png)

SSL initiates an **authentication** process called a [handshake](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) between two communicating devices to ensure that both devices are really who they claim to be.

Originally, data on the Web was transmitted in plaintext that anyone could read if they intercepted the message. For example, if a consumer visited a shopping website, placed an order, and entered their credit card number on the website, that credit card number would travel across the Internet unconcealed.

SSL was created to correct this problem and protect user privacy. By encrypting any data that goes between a user and a web server, SSL ensures that anyone who intercepts the data can only see a scrambled mess of characters. The consumer's credit card number is now safe, only visible to the shopping website where they entered it.

SSL has not been updated since SSL 3.0 in 1996 and is now considered to be deprecated. There are several known vulnerabilities in the SSL protocol, and security experts recommend discontinuing its use. In fact, most modern web browsers no longer support SSL at all.

TLS is the up-to-date encryption protocol that is still being implemented online, even though many people still refer to it as "SSL encryption."

### Content Secure Policy

Content Security Policy (CSP) is a security standard implemented by web browsers to prevent cross-site scripting (XSS), clickjacking, and other code injection attacks. It works by allowing web developers to specify which sources of content are trusted and can be loaded on a web page. CSP is typically implemented through HTTP headers or meta tags, defining rules for various types of resources like scripts, stylesheets, images, and fonts. By restricting the origins from which content can be loaded, CSP significantly reduces the risk of malicious code execution. It also provides features like reporting violations to help developers identify and fix potential security issues.
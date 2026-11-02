# PROG 02. Backend — Caching Strategies & Architecture

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

Caching is a technique used in computing to store and retrieve frequently accessed data quickly, reducing the need to fetch it from the original, slower source repeatedly. It involves keeping a copy of data in a location that's faster to access than its primary storage. Caching can occur at various levels, including browser caching, application-level caching, and database caching. It significantly improves performance by reducing latency, decreasing network traffic, and lowering the load on servers or databases. Common caching strategies include time-based expiration, least recently used (LRU) algorithms, and write-through or write-back policies. While caching enhances speed and efficiency, it also introduces challenges in maintaining data consistency and freshness. Effective cache management is crucial in balancing performance gains with the need for up-to-date information in dynamic systems.

### Server Side

Caching is a process or method of storing a copy of the continuously asked data in a temporary storage location or cache to be quickly accessed when needed.

A cache is a memory reserved for storing temporary files or data from apps, servers, websites, or browsers to help load faster when requested. It includes images, videos, animation, gifs, scripts, files, etc.

# Server-Side Caching

Server-side caching temporarily stores web files and data on the origin server to reuse later.

When the user first requests for the webpage, the website goes under the normal process of retrieving data from the server and generates or constructs the webpage of the website. After the request has happened and the response has been sent back, the server copies the webpage and stores it as a cache.

# Client-Side Caching

Client-side caching temporarily stores web files and data in the browser memory instead of keeping it in the server.

When a user visits a website, the webpage gets cached in the user's browser memory, which means a copy of the webpage is stored.

# Remote Caching

Remote Caching is similar to Server Side Caching, but it can also run an application to serialize and deserialize the data. The difference is that you control the remote server, and someone else does not operate it.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 03. Backend — API Architecture & Design Patterns]]
- [[PROG 13. Frontend — Web Performance, Critical Path & Best Practices]]

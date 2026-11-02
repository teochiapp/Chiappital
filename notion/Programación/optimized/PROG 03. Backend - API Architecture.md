# PROG 03. Backend — API Architecture & Design Patterns

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

### REST (Representational State Transfer)

A REST API (Representational State Transfer Application Programming Interface) is an architectural style for designing networked applications. It relies on standard HTTP methods (GET, POST, PUT, PATCH, DELETE) to interact with resources, which are represented as URIs (Uniform Resource Identifiers). 

REST APIs are stateless, meaning each request from a client to a server must contain all the information needed to understand and process the request. They use standard HTTP status codes to indicate the outcome of requests and communicate in formats like JSON or XML. REST APIs are widely used due to their simplicity, scalability, and ease of integration with web services and applications.

---

### Principios Fundamentales de REST

1. **Client-Server Architecture**: Separación estricta de responsabilidades entre interfaz de usuario y capa de datos/lógica de negocio.
2. **Statelessness (Sin estado)**: Ningún contexto del cliente se almacena en el servidor entre peticiones. Toda sesión vive en el cliente (tokens, headers).
3. **Cacheability**: Las respuestas deben definirse explícitamente como cacheables o no cacheables (`Cache-Control`, `ETag`).
4. **Uniform Interface**: Interfaz estándar y predecible mediante URIs de recursos y métodos estándar.
5. **Layered System**: El cliente no puede asumir si está conectado directamente al servidor final o a un intermediario (proxy, CDN, balanceador de carga).

---

### Matriz de Verbos HTTP

| Método | Propósito | ¿Seguro? | ¿Idempotente? | Código Éxito Típico |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | Recuperar representación de un recurso | ✅ Sí | ✅ Sí | 200 OK |
| `POST` | Crear un nuevo recurso o ejecutar acción | ❌ No | ❌ No | 201 Created |
| `PUT` | Reemplazar completamente un recurso | ❌ No | ✅ Sí | 200 OK / 204 No Content |
| `PATCH` | Modificación parcial de un recurso | ❌ No | ❌ No | 200 OK |
| `DELETE` | Eliminar un recurso | ❌ No | ✅ Sí | 204 No Content / 200 OK |
| `OPTIONS` | Consultar capacidades y headers CORS permitidos | ✅ Sí | ✅ Sí | 204 No Content |
| `HEAD` | Obtener headers idénticos a GET sin body | ✅ Sí | ✅ Sí | 200 OK |

---

### Cheatsheet de Códigos de Estado HTTP

```
2xx Éxito
  200 OK: Petición completada con éxito.
  201 Created: Recurso creado exitosamente (incluir header Location).
  204 No Content: Acción exitosa sin contenido en el body de respuesta (común en DELETE/PUT).

3xx Redirección & Caché
  301 Moved Permanently: El recurso cambió de URI permanentemente.
  304 Not Modified: El recurso no ha cambiado desde la fecha enviada en If-None-Match (ETag).

4xx Errores de Cliente
  400 Bad Request: Sintaxis inválida o parámetros incorrectos.
  401 Unauthorized: Falta autenticación válida o token expirado.
  403 Forbidden: Autenticado pero sin permisos para acceder al recurso.
  404 Not Found: El recurso solicitado no existe.
  409 Conflict: Conflicto con el estado actual del recurso (ej. email duplicado).
  422 Unprocessable Entity: Sintaxis correcta pero validaciones de negocio fallidas.
  429 Too Many Requests: Límite de tasa (Rate Limit) alcanzado.

5xx Errores de Servidor
  500 Internal Server Error: Excepción no capturada en el servidor.
  502 Bad Gateway: El servidor intermediario recibió una respuesta inválida del servidor upstream.
  503 Service Unavailable: Servidor temporalmente fuera de servicio por sobrecarga o mantenimiento.
  504 Gateway Timeout: El upstream no respondió a tiempo.
```

---

### JSON:API Specification

JSON or JavaScript Object Notation is an encoding scheme designed to eliminate ad-hoc code for API communication. The JSON:API specification defines conventions for data structures, entity types, relationships, pagination, and error envelopes:

```json
{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "Clean Architecture Principles",
      "slug": "clean-architecture-principles"
    },
    "relationships": {
      "author": {
        "data": { "type": "people", "id": "9" }
      }
    }
  }
}
```

---

### Comparativa de Paradigmas de API

| Criterio | REST | GraphQL | gRPC | WebSockets |
| :--- | :--- | :--- | :--- | :--- |
| **Protocolo** | HTTP 1.1 / HTTP/2 | HTTP POST | HTTP/2 (Protobuf) | TCP Bidireccional |
| **Payload** | JSON / XML | JSON | Binario compacto | Texto / Binario |
| **Fetch Pattern** | Múltiples endpoints | 1 endpoint (`/graphql`) | RPC Methods | Event-Driven Streams |
| **Over/Under fetching** | Posible | Eliminado | Eliminado | No aplica |
| **Mejor para** | APIs públicas, CRUD | UIs complejas, Apps móviles | Microservicios internos | Tiempo real, chats, trading |

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 01. Backend — Authentication & Token Strategies]]
- [[PROG 02. Backend — Caching Strategies & Architecture]]
- [[PROG 04. Backend — Web Security & OWASP Defense]]

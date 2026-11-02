# Authentication

### JWT

(JSON Web Token) is an open standard for securely transmitting information between parties as a JSON object. It consists of three parts: a header (which specifies the token type and algorithm used for signing), a payload (which contains the claims or the data being transmitted), and a signature (which is used to verify the token’s integrity and authenticity). JWTs are commonly used for authentication and authorization purposes, allowing users to securely transmit and validate their identity and permissions across web applications and APIs. They are compact, self-contained, and can be easily transmitted in HTTP headers, making them popular for modern web and mobile applications.

JWTs are signed using a cryptographic algorithm to ensure that the claims cannot be altered after the token is issued.

To put it simply, a token is a string of data that represents something else, such as an identity.

### OAuth

OAuth is an open standard for authorization that allows third-party applications to access a user's resources without exposing their credentials. It works by issuing access tokens after users grant permission, which applications then use to interact with resource servers on behalf of the user. This process involves a resource owner (the user), a resource server (which holds the data), and an authorization server (which issues tokens). OAuth enables secure, token-based access management, commonly used for granting applications permissions to interact with services like social media accounts or cloud storage.

### Basic Authentication

Basic Authentication is a simple HTTP authentication scheme built into the HTTP protocol. It works by sending a user's credentials (username and password) encoded in base64 format within the HTTP header. When a client makes a request to a server requiring authentication, the server responds with a 401 status code and a "WWW-Authenticate" header. The client then resends the request with the Authorization header containing the word "Basic" followed by the base64-encoded string of "username:password".

### Token Authentication

Token-based authentication is a protocol which allows users to verify their identity, and in return receive a unique access token. During the life of the token, users then access the website or app that the token has been issued for, rather than having to re-enter credentials each time they go back to the same webpage, app, or any resource protected with that same token. Auth tokens work like a stamped ticket.

The user retains access as long as the token remains valid. Once the user logs out or quits an app, the token is invalidated.

### **Cookie-Based Authentication**

Cookie-based authentication is a method of maintaining user sessions in web applications. When a user logs in, the server creates a session and sends a unique identifier (session ID) to the client as a cookie. This cookie is then sent with every subsequent request, allowing the server to identify and authenticate the user.
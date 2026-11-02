# PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

### Clean Agile

The bad boy that no one wants:

![Clean Agile Outer, Middle and Inner Rings](/uploads/prog-gentleman-clean-agile.png)

![Clean Architecture Dependency Rule](/uploads/prog-gentleman-clean-architecture.png)

### AGILE

![Software Architecture Patterns vs Design Patterns](/uploads/prog-gentleman-architecture-patterns.png)

We continuously get requirements, as we work on small functionalities we can choose what are the most critical needs and implement a plan of action to deliver small parts that can fulfill this end.

We continuously do an analysis of the requirements to prepare future work. The amount will correspond to the timeframe we already decided according to the needs.

Now with everything prepared we are comfortable to start working on our tasks inside a sprint. It
represents the time frame we decided in which we compromise ourselves to deliver a certain amount of work and it can be variable depending on the need.

We deliver the functionalities and continue with the process again. The main difference is that we start the work with stakeholders feedback from the previous iteration.

### OUTER RING

### 🔹 **Planning Game**

Break the project into smaller parts (features, stories, tasks) for better clarity and organization.

---

### 🔹 **Small Releases**

Avoid building full functionalities in one go—it leads to a waterfall approach.

Instead, identify and prioritize small, valuable pieces to deliver quickly.

Smaller pieces = faster feedback and quicker iterations.

---

### 🔹 **Acceptance Tests**

Define clearly as a team what “done” means.

Focus on the **minimum valuable functionality** that can be delivered.

Avoid vague requirements—build features with a clear start and end that provide standalone value.

---

### 🔹 **Whole Team**

Every team member plays a role: frontend, backend, design, product, PM, etc.

The challenge is **communication**—how to align work that’s different but interdependent.

(We’ll come back to this later.)

### MIDDLE RING

### 🔹 **Sustainable Pace**

Asking *"When will it be done?"* always leads to *"As soon as possible."*

But maintaining that intensity constantly leads to burnout.

Aim for small, contained features that can be delivered at a **sustainable, steady pace**.

---

### 🔹 **Collective Ownership**

Lack of shared context leads to confusion.

Information often stays in private chats or meetings, creating a **broken communication chain**.

The team needs a **clear communication strategy** so everyone stays informed.

---

### 🔹 **Continuous Integration**

Commit code **frequently**—ideally daily.

Avoid isolated work that leads to duplicated efforts and misalignment.

Frequent commits = faster feedback + always working on the latest version.

Waiting until the end of a feature = **waterfall trap**.

---

### 🔹 **Metaphor**

The team should share a **common language and definitions**.

Using different terms for the same thing causes confusion.

Think of each project as its own country—agree on the shared terms and metaphors to avoid misunderstandings.

### INNER RING

### 🔹 **Pair Programming**

Solving problems together leads to faster solutions and shared understanding.

It encourages communication, helps align conventions, and builds context within the team.

Real-time collaboration = real-time feedback.

---

### 🔹 **Simple Design**

Aim for small, simple, and valuable solutions.

Avoid overengineering—start simple and **iterate**.

A simple, working feature is better than a complex one that might be irrelevant later.

---

### 🔹 **Refactoring**

“If it works, don’t touch it” leads to **legacy code**.

Refactor frequently to reduce technical debt.

Use sprint time (start or end) to clean up code when needed.

Pair programming helps during refactoring too.

---

### 🔹 **Test-Driven Development (TDD)**

Write tests **before** writing the code.

Tests define the requirements and guide implementation.

Great for ensuring quality and making safe refactors.

### 🔹 **Functional Programming**

A declarative coding paradigm focused on **no side effects** and **atomic logic**.

Unlike **imperative programming** (focuses on how), functional programming emphasizes **what** to do.

---

### 🔸 Imperative Example (JavaScript):

```jsx
javascript
CopiarEditar
var exampleArray = [
  { name: 'Alan', age: 26 },
  { name: 'Axel', age: 23 },
];

function searchObject(name) {
  var foundObject = null;
  var index = 0;
  while (!foundObject && exampleArray.length > index) {
    if (exampleArray[index].name === name) {
      foundObject = exampleArray[index];
    }
    index += 1;
  }
  return foundObject;
}

console.log(searchObject('Alan'));
// { name: 'Alan', age: 26 }

```

---

### 🔸 Functional Example:

```jsx
javascript
CopiarEditar
const result = exampleArray.find(element => element.name === name);
console.log(result);

```

---

### ✅ Why Functional?

- **Shorter and more scalable**
- **No side effects** (doesn’t mutate external state)
- **Deterministic**: same input = same output
- Encourages **reusable**, **testable**, and **atomic** logic

# CLEAN ARQUITECTURE

Clean Architecture is an architectural pattern, and what makes it special is that it helps you organize your project in a way that, no matter how much time passes, you can maintain and expand it without wanting to pull your hair out.

With Clean Architecture, each piece of the system has its place and its responsibilities clearly defined, making even the largest projects easy to manage.

What is the Separation of Concerns? First, let's get serious and define what this is. Separation of Concerns is nothing more than a pro strategy for organizing our code. Imagine you're organizing a party and have to keep Boca and River fans separated... well, that's kind of what we do here, but with our code

### 🔹 **Advantages: Maintainability & Scalability**

- **Separation of Concerns** leads to cleaner, more organized code.
- Each part of the system handles only its own responsibility.
- Easier to **maintain** and **fix bugs**.
- Great foundation for **scaling**—new features can be added without breaking other parts.

---

### 🔹 **Practical Recommendations**

- In **Clean Architecture**, define **clear interfaces** between layers.
    
    ➤ “You handle this; don’t interfere with that.”
    
- Keep interfaces **clean and well-scoped**.
- Don’t fear **reorganizing layers** as the system evolves—**flexibility is essential**.

### 🔸 **What Are Design Patterns?**

- Reusable, **proven solutions** to common coding problems.
- Like recipes: e.g., the **Factory Pattern** helps create objects without specifying exact classes.
- Focused, tactical tools used within parts of a system.

---

### 🔸 **What Is Software Architecture?**

- The **overall structure** of an application.
- Defines how components interact, manage data, and handle flow.
- Think of it as the **blueprint** for the entire system.

---

### 🔸 **Key Differences**

- **Scope** is the main difference:
    
    ➤ *Design Patterns* solve specific problems.
    
    ➤ *Architectures* define the whole system’s organization.
    
- Analogy:
    
    ➤ Pattern = changing chair upholstery
    
    ➤ Architecture = designing the entire living room
    

---

### 🔸 **Integration in Clean Architecture**

- Patterns work **within** the architectural framework.
- They help enforce **separation of concerns**, maintainability, and scalability.
- Patterns = **tactics**, Architecture = **strategy**

learn and master various design patterns, but always keep in mind how these fit within the general architecture of your application. Don't be tempted to apply a pattern just because; each pattern has its place and its time, and knowing when and how to use it is what separates good programmers
from true masters.

### 🔹 **Maintainability in Clean Architecture**

Imagine a car where changing one part requires disassembling half the engine—Clean Architecture avoids this by **separating responsibilities**.

- Each component (UI, logic, DB) is **isolated** and can be modified independently.
- Easier to **understand, test, and fix bugs** without affecting other parts.
- Changes are targeted, reducing the risk of breaking existing features.

---

### 🔹 **How It Looks in Practice**

Example:

You can update the **UI** without touching the **business logic** or **database**.

This leads to faster, safer development.

---

### 🔹 **Scalability with Clean Architecture**

- Scaling means more than just handling traffic—it’s also about adding features.
- Clean Architecture allows for **modular feature additions**.
- New functionalities = self-contained blocks connected via **clear interfaces**.
- No need to rewrite what already works—**expansion without chaos**.

### 🔹 **What Is Plugin Architecture?**

Think of your software like a **soccer team**—each player (module) has a role, and can be swapped in or out without affecting the whole team.

In Plugin Architecture, parts of the system are **modular components** that can be "plugged in" or "unplugged" without disrupting core functionality.

---

### 🔹 **Flexibility & Adaptability**

- Perfect for projects needing quick adaptation.
- Want to add analytics or update payments? Just **plug in** a new module.
- Easy to **update or replace** components with minimal impact on the rest of the system.

---

### 🔹 **Practical Implementation**

- Each plugin must use a **standardized interface**.
- Modules communicate without needing to know each other's internal logic.
    
    ➤ *“Just do this—I don’t care how.”*
    
- Encourages **clean, testable, and change-friendly** code.

---

### 🔹 **Advantages of Plugin Architecture**

- Enables **isolated testing** of new features.
- Faster development and safer deployments.
- Reduces risk when modifying complex systems.

---

### 🔹 **Real-World Example**

Imagine a **hotel reservation app**.

To add special event management, build a **plugin module** that handles all event-related tasks.

It connects to the main system via a defined interface—clean and independent.

---

### 🔹 **Conclusion**

Plugin Architecture showcases the **adaptability and scalability** of Clean Architecture.

It helps manage evolving systems without chaos.

Next up: the **downsides and timing considerations** of Clean Architecture—stay tuned!

### 🔹 **Disadvantages of Rigorous Structuring**

- **Clear separation** is powerful but requires **rigorous planning and discipline**.
- Can increase **initial development time**, which is a downside for tight deadlines.
- Not everything that glitters is gold!

---

### 🔹 **Verbosity and Complexity**

- Clean Architecture can lead to many files and directories.
- This **verbosity** can overwhelm newcomers.
- Sometimes it feels like writing more **scaffolding code** than actual business logic.

---

### 🔹 **When to Use Clean Architecture?**

- Best suited for **large, complex apps** requiring **long-term maintenance and scalability**.
- For **small projects or quick prototypes**, it might be **overkill**—simplicity is better there.

---

### 🔹 **The Cost of Time**

- Learning and applying Clean Architecture properly takes **time and effort**.
- Major shifts (e.g., monolith to Clean) require a **steep learning curve** and effort.
- This can be a challenge under tight delivery pressures.

---

### 🔹 **Chapter Conclusion**

- Is it worth it? **Yes, if the context fits.**
- Not a one-size-fits-all, but in the right projects, it turns chaos into a maintainable, scalable system.
- Remember: **The best architecture serves the project and team needs.**
- Keep coding, learning, and enjoying the journey!
- 

### 🔹 **Chapter 7: The Structure of Clean Architecture — A Layered View**

Clean Architecture, created by Robert C. Martin (Uncle Bob), organizes software into distinct layers to promote separation of concerns and framework independence.

---

### 🔸 **1. Entities Layer**

- Core business logic and rules.
- Independent of frameworks or databases.
- Contains domain objects with critical data and business logic.

---

### 🔸 **2. Use Cases Layer**

- Implements user actions and business processes.
- Orchestrates data flow between entities and outer layers.
- Focuses only on application logic, unaware of UI or data storage.

---

### 🔸 **3. Interface Adapters Layer**

- Bridges internal logic and external systems.
- Converts data formats between use cases/entities and external agents (e.g., database, UI).
- Example: MVC controllers that translate user input for use cases.

---

### 🔸 **4. Frameworks & Drivers Layer**

- Handles implementation details: databases, UI frameworks, external tools.
- Isolates infrastructure dependencies to minimize code changes if swapping tools.

---

### 🔹 **Chapter Conclusion**

- Layered structure makes the app easier to **maintain, test, and extend**.
- Changes in UI or database minimally impact core business logic.
- Supports adaptable, future-proof systems ready for modern challenges.

## 🛠️ Why Maintenance Is Key in Clean Architecture

One of the biggest perks of applying Clean Architecture is that maintaining the software stops being a nightmare. Thanks to its well-thought-out structure, we can adapt to changes without tearing apart what already works.

---

## 🧩 Outer Layers: What’s on the Periphery?

### 🎨 Frontend

Whether you're using React, Vue, Angular, or any other framework, the frontend belongs to the outer layer. Its role is simple but essential: display info to users and capture their interactions. These interactions are then sent to the core of the app through adapters.

### 🔌 Backend

The backend is also part of this layer. Its main job is to connect the frontend with the application’s domain, processing requests and applying business logic.

### 🗄️ Database

A lot of folks think the database is the “heart” of the app—but in Clean Architecture, it’s just another implementation detail. It’s accessed through adapters, keeping the domain free from unnecessary dependencies.

---

## ✨ Where’s the Magic? In the Adapters

Adapters are key to connecting the outside world to our system without dirtying the business logic. Thanks to them, we can switch technologies (an API, a database, a framework) without touching the app’s core.

---

## 🚀 Performance Optimization in the Outer Layer

Performance matters. Especially in the outer layer, where every millisecond counts. Here are a few key strategies:

### ⚡ Caching

Adding caching in adapters can drastically reduce server load. For example, storing common database responses avoids repetitive and costly queries.

### 🔄 Asynchronous Operations

Using async operations allows you to keep processing tasks while waiting on server or DB responses. Perfect for a smooth experience without blocking the flow.

---

## 🔒 Security Starts at the Edge

As the first point of contact with the outside world, the outer layer is the most exposed. It needs to be solid:

### ✅ Data Validation and Sanitization

Every bit of data that enters through the outer layer should be validated and cleaned. This helps prevent attacks like injection or other malicious inputs. Adapters act as filters here.

### ⚠️ Error Handling

Catching and managing errors at this layer helps prevent internal problems from spreading—or sensitive data from leaking.

---

## 🧠 Core Principles of Clean Architecture

### 1. Clear Separation of Concerns

Each part of the app should handle just one thing. This makes the code easier to maintain, scale, and allows teams to work in parallel without stepping on each other’s toes.

### 2. Domain Independence

The domain (your business rules) should be isolated from everything else. It shouldn’t depend on frameworks, databases, or UI. That makes it more stable and resilient to change.

### 3. Adapters and Outer Layers

They act as guardians of the domain. They bridge the external and internal worlds and let us swap technologies without touching the core.

### 4. Flexibility and Adaptability

The system can evolve without drama. Changing the payment provider? Switching databases? With this setup, you won’t have to mess with the core logic.

### 5. Maintenance and Growth

A good architecture makes testing, documentation, and refactoring easier. And that means software that ages well (like fine wine 🍷).

---

## ✅ Final Thoughts

The goal isn’t just to solve today’s problem. It’s to build something that still works tomorrow, that can grow, adapt, and won’t make you cry when something needs to change.

**Clean Architecture is a proven way to get there.** By applying its principles, you can lead projects that solve real problems, scale efficiently, and support both technical and business innovation.

---

## 🚀 A Final Thought

This approach isn’t the end of the road. It’s the start of a new way of seeing software: cleaner, more modular, and better designed. With these tools in your belt, you’re more than ready to handle whatever modern dev life throws at you.

---

## 🗂️ Organic Approach to Folder Structure

Unlike traditional approaches that force a rigid structure from the get-go, I prefer a more **organic** style. The idea is to let the project structure **evolve naturally** as requirements grow.

> 🚫 I’m not a fan of over-structuring things at the start.
> 
> 
> ✅ The structure should emerge from the actual needs of the project and the team.
> 

---

## 🔌 Services and Adapters

### Services

**Services** are used by components to interact with external entities (like backends, APIs, etc.).

📁 They're usually placed in a subfolder called `services`.

Responsibilities:

- Send and receive data from the outside world.

---

### Adapters

**Adapters** go in the `adapters` folder within each module.

Responsibilities:

- Map data between the format expected by external services and the one used by the internal domain.
- Ensure smooth and consistent communication between the outside and the domain.

---

## 🧱 Container Pattern Structure

Instead of having components and logic scattered around, the **container pattern** groups everything related to a single feature in one folder.

### 🧍‍♂️ Example: `UserManagement/`

```
cpp
CopiarEditar
UserManagement/
├── components/
│   ├── UserProfile.js
│   └── UserList.js
├── hooks/
│   ├── useUserSearch.js
│   └── useUserProfile.js
├── models/
│   └── UserModel.js
├── services/
│   └── UserService.js
├── adapters/
│   └── UserAdapter.js
└── UserContainer.js  // Main container component

```

---

## 🛠 How the Container Pattern Works

- **Encapsulation:** Each container manages its own state and dependencies.
- **Independence:** You don’t need other modules to work on one.
- **Reusability:** You can reuse containers in different parts or projects.
- **Lazy Loading:** With modern frameworks, you can load containers only when needed.

---

## ✅ Benefits of the Container Pattern

- **Better organization:** Cleaner, more modular code.
- **Loose coupling:** Fewer cross-dependencies.
- **Scalability:** Add new modules without breaking existing ones.
- **Easy maintenance:** Everything you need is in one place.

---

## 🛒 Example Structure for an E-commerce App

```
css
CopiarEditar
src/
├── products/
│   ├── ProductsContainer.js
│   ├── components/
│   │   ├── ProductList.js
│   │   └── ProductItem.js
│   ├── services/
│   │   └── ProductService.js
│   └── adapters/
│       └── ProductAdapter.js

├── cart/
│   ├── CartContainer.js
│   ├── components/
│   │   ├── CartView.js
│   │   └── CartItem.js
│   ├── services/
│   │   └── CartService.js
│   └── adapters/
│       └── CartAdapter.js

├── checkout/
│   ├── CheckoutContainer.js
│   ├── components/
│   │   ├── PaymentForm.js
│   │   └── OrderSummary.js
│   ├── services/
│   │   └── PaymentService.js
│   └── adapters/
│       └── PaymentAdapter.js

```

## Mastering React, the Frameworkless Gem

Establish Code Standards
React is very flexible, but that flexibility can lead to code inconsistencies if
clear guidelines are not set. Define style and architecture guides from the start

Leverage the Community
The React community is vast and always willing to help. Encourage your team
to participate in forums, webinars, and conferences to stay updated with the latest trends and best
practices.
Prioritize Quality Over Speed
While React can enable rapid development, it is essential not to sacrifice
code quality. Implement unit and integration tests from the beginning to ensure applications are robust
and maintainable

Correct Cases for useEffect

1. API Calls
A correct use of
useEffect
is for API calls, where you need to perform an asynchronous action when the
component mounts
2. Subscriptions and Cleanup
useEffect
is useful for subscribing to external services and cleaning up those subscriptions when the
component unmounts
3. Data Synchronization
Another useful application of
useEffect
is synchronizing data between components or with external services.
For example, synchronizing local state with the browser's local storage:

Understanding children
We can use props.children to dynamically pass content from a parent component to a child component.

Composition for the Win
Composition in React allows for building more complex components from simpler components. Instead of
passing props through many levels, we can use the
children
property to pass elements directly.

Example of Composition:
const const const const    Father Father Father Father Father    ====    (((())))    => => => =>    {{{{
const const const const sharedProp  sharedProp  sharedProp  sharedProp ====    'Shared Information' 'Shared Information' 'Shared Information' 'Shared Information';;;;
return return return return    ((((
<<<<Child1 Child1 Child1 Child1 Child1>>>>
<<<<Child2 Child2 Child2 Child2 Child2    sharedProp sharedProp sharedProp sharedProp===={{{{sharedProp sharedProp sharedProp sharedProp}}}}    /> /> /> />
</ </ </ </Child1 Child1 Child1 Child1 Child1>>>>
))));;;;
}}}};;;;
const const const const    Child1 Child1 Child1 Child1 Child1    ====    (((({{{{ children  children  children  children }}}}))))    => => => =>    {{{{
return return return return    <<<<div div div div>>>>{{{{children children children children}}}}</ </ </ </div div div div>>>>;;;;
}}}};;;;
const const const const    Child2 Child2 Child2 Child2 Child2    ====    (((({{{{ sharedProp  sharedProp  sharedProp  sharedProp }}}}))))    => => => =>    {{{{
return return return return    <<<<div div div div>>>>{{{{sharedProp sharedProp sharedProp sharedProp}}}}</ </ </ </div div div div>>>>;;;;
}}}};;;;
Advantages of Composition
Simple
Less repetitive code and clearer.
Scalable
Easy to scale as the application grows.
No Dependencies
Does not depend on the provider's location like the Context API.
Reusable Code
Components can be easily reused in different parts of the application.
Individual Logic
Each component handles its own logic independently.

Using Context
When developing applications with React, we often need to share information between components that do
not have a direct relationship. The React Context API provides a more robust and scalable way to handle this
type of situation.
What is Context?
The React Context API allows sharing values between components without having to pass props explicitly
through each level of the component tree. It is particularly useful for themes, language settings, or any other
type of data that needs to be accessible in many parts of the application.
Creating a Context
First, we need to create a context. This is done with the
createContext
function from React:
import import import import    {{{{ createContext createContext createContext createContext,,,, useContext useContext useContext useContext,,,, useState  useState  useState  useState }}}}    from from from from    'react' 'react' 'react' 'react';;;;
export export export export    const const const const    GentlemanContext GentlemanContext GentlemanContext GentlemanContext    ====    createContext createContext createContext createContext createContext(((())));

Context Provider
The context provider is the component that wraps those components that need to access the context. It
defines the context value that will be shared.
export export export export    const const const const    GentlemanProvider GentlemanProvider GentlemanProvider GentlemanProvider GentlemanProvider    ====    (((({{{{ children  children  children  children }}}}))))    => => => =>    {{{{
const const const const    [[[[gentlemanContextValue gentlemanContextValue gentlemanContextValue gentlemanContextValue,,,, setGentlemanContextValue setGentlemanContextValue setGentlemanContextValue setGentlemanContextValue]]]]    ====    useState useState useState useState useState(((('' '' '' ''))));;;;
return return return return    ((((
<<<<GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider
value value value value===={{{{{{{{ gentlemanContextValue gentlemanContextValue gentlemanContextValue gentlemanContextValue,,,, setGentlemanContextValue  setGentlemanContextValue  setGentlemanContextValue  setGentlemanContextValue }}}}}}}}
>>>>
{{{{children children children children}}}}
</ </ </ </GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider GentlemanContext.Provider>>>>
))));;;;
}}}};

export export export export    const const const const    useGentlemanContext useGentlemanContext useGentlemanContext useGentlemanContext useGentlemanContext    ====    (((())))    => => => =>    {{{{
const const const const context  context  context  context ====    useContext useContext useContext useContext useContext((((GentlemanContext GentlemanContext GentlemanContext GentlemanContext))));;;;
if if if if    ((((context context context context === === === ===    undefined undefined undefined undefined))))    {{{{
throw throw throw throw    new new new new    Error Error Error Error Error(((('GentlemanContext must be used within a GentlemanProvider' 'GentlemanContext must be used within a GentlemanProvider' 'GentlemanContext must be used within a GentlemanProvider' 'GentlemanContext must be used within a GentlemanProvider'))));;;;
}}}}
return return return return context context context context;;;;
}}}};

Advantages of the Context API

1. Understandable
The data flow is clear and easy to follow. Components can access the context directly
without the need to pass unnecessary props.
2. Scalable
The Context API can handle applications of any size without the maintenance issues associated
with Prop Drilling.
3. Centralized
The shared state is centralized, making it easy to manage and update

useRef
The Constant Reference
The
useRef
hook allows us to create a mutable reference that can persist throughout the entire lifecycle of the
component without causing re-renders.

useRef
The Constant Reference
The
useRef
hook allows us to create a mutable reference that can persist throughout the entire lifecycle of the
component without causing re-renders.

useMemo
Memoization of Calculations
useMemo
is used to memoize costly calculated values and only recalculate them when one of the
dependencies has changed. This is especially useful for improving the performance of components that
perform intensive calculations

useCallback
Memoization of Functions
useCallback
is similar to
useMemo
, but instead of memorizing the result of a function, it memorizes the
function itself. This is useful to avoid unnecessary recreations of functions, especially when passed as props to
child components that could cause additional renders

 Making API Requests and Handling Asynchronous Logic

The Fetch Function
fetch
is a native JavaScript function used to make HTTP requests to an API. Its basic usage is as follows:
fetch
fetch((
'[https://api.example.com/data](https://api.example.com/data)'
'[https://api.example.com/data](https://api.example.com/data)'
..
then
then((
response

response
=>
=>
response
response
..
then
then((
data

data
..
catch
catch((
=>

=>
error

error
console
console
=>

=>
console
console
))
..
json
json
..
log
log
..
((
data
data
error
error
(())))
))))
((
'Error:'
'Error:',,
error
error))))
;

URL
The address to which the request is made.
HTTP Method
By default,
fetch
uses the GET method. We can specify other methods POST, PUT,
DELETE, etc.) by passing a configuration object as the second argument.
Headers
Additional information sent with the request, such as content type Content-Type) or
authentication tokens.
Body
Data sent with the request, especially in POST or PUT methods

Importance of Security in Local Storage
It's crucial to emphasize that Local Storage is not a secure place to store sensitive information such as
authentication tokens, passwords, or any personal data. Local Storage is accessible by any script running on
the same page, making it vulnerable to Cross-Site Scripting XSS

attacks.
Therefore, it's recommended to store in Local Storage only non-critical data for the security of both the
application and the user.

Concept of Portals
Portals are particularly useful in situations where you need a component to render outside the normal flow of
the DOM, such as:
Modals and Dialogs
Ensuring that modals appear correctly on top of other content.
Tooltips and Popovers
Facilitating the management of overlays and dynamic positioning.
Context Menus
Avoiding issues with z-index and overflow of parent elements

STYLES in React

Comparison of Approaches
Traditional CSS
Use
Ideal for small and quick projects.
Simplicity
High.
Maintenance
Can be challenging in large projects due to lack of encapsulation.
CSS-in-JS Styled Components)
Use
Ideal for highly reusable components and projects heavily using JavaScript.
Simplicity
Medium, syntax may be a hurdle for some.
Maintenance
High, thanks to encapsulation and theme support.
Performance
May be less efficient due to runtime processing. Alternatives like
panda css
can mitigate
this by performing build-time processing.
SCSS Modules
Use
Ideal for projects requiring strong SCSS usage and style encapsulation.
Simplicity
Medium-High, familiarity with SCSS is a plus.
Maintenance
High, with local styles and powerful SCSS features.

TypeScript: The Superhero of Development
First, let's imagine that TypeScript is a superhero. Its mission: to save us from JavaScript code errors and
nightmares. But, like any good superhero, it has its limits and areas of operation. In this case, TypeScript only
uses its superpowers during development

As we said earlier, TypeScript is JavaScript on steroids. It allows you to add types to your variables and
functions, which helps avoid common errors. But here's the trick: when your application runs in the browser or
Node.js, all that TypeScript code has been transformed (or transpiled) into JavaScript. It's like our superhero
takes off the suit and puts on a regular uniform

Framework Radar
Astro
Overview
Astro is a modern static site generator optimized for performance and SEO. It allows you to build static sites
with minimal JavaScript, leveraging a component-based architecture that can integrate with other frameworks.
Key Features
SEO Optimization
Designed with SEO in mind, providing excellent performance and visibility.
No JavaScript
Allows building sites with minimal or no JavaScript, improving load times and
performance.
Astro Islands
Supports integration of components from frameworks like React, Vue, and Angular.
Static Content Focus
Ideal for static sites like blogs, documentation, and marketing pages.
Job Market
Limited job opportunities compared to other more established frameworks.
Dynamic Content
Can handle dynamic content but with some limitations

Ideal Use Cases
SEO-Driven Projects
Projects where SEO and performance are top priorities.
Static Sites
Blogs, documentation sites, and other content-heavy websites.
Minimal JavaScript
Applications where minimal or no JavaScript is desirable

Team Composition
Frontend Developers
Developers familiar with HTML, CSS, and a bit of JavaScript.
SEO Specialists
To leverage Astro's SEO capabilities.
Content Creators
Focused on static content generation.
Framework Integrators
Developers who can integrate React, Vue, or Angular components if needed

Next.js
Overview
Next.js is a powerful React framework known for its server-side rendering SSR

capabilities and static site
generation SSG. It is highly suitable for both static and dynamic websites, offering excellent performance and
flexibility.
Key Features
SEO Optimization
Provides strong SEO capabilities through SSR and SSG.
Server Components
Renders HTML on the server, enhancing performance and SEO.
Hybrid Approach
Supports both static and dynamic content seamlessly.
API Routes
Built-in API routes for creating backend services.
Extensive Ecosystem
Large community and extensive library support

Ideal Use Cases
Public Applications
Ideal for public-facing websites and applications where SEO is crucial.
E-commerce Platforms
Suitable for complex, high-traffic e-commerce sites.
Dynamic Web Apps
Applications requiring a mix of static and dynamic content.
React-Based Projects
Projects leveraging the React ecosystem and its libraries.
Team Composition
React Developers
Skilled in React and its ecosystem.
Full-Stack Developers
Capable of working with both frontend React) and backend Node.js).
SEO Specialists
To ensure the application is optimized for search engines.
DevOps Engineers
For deployment and maintaining server-side infrastructure.
UX/UI Designers
To create engaging and user-friendly interfaces

Best For:
SEO, Static Content:
Astro
Public Apps, E-commerce:
Next.js
Vue Projects, SEO Apps:
Nuxt
Large-scale Apps, SSR:
Angular 18
High Performance, SEO:
SvelteKit, Qwik

# 🚀 Mastering React – Summary for Notion

---

## 📐 Code Standards & Team Practices

### ✅ Establish Code Standards

- React is flexible, but that can lead to inconsistencies.
- Set **style and architecture guidelines** from the beginning.

### 🧠 Leverage the Community

- Participate in **forums, webinars, and conferences**.
- Stay up to date with best practices and trends.

### 🐢 Prioritize Quality Over Speed

- Implement **unit and integration tests** early.
- Focus on **robust and maintainable** code.

---

## 🧩 Correct useEffect Scenarios

1. **API Calls**
    
    Run async actions when the component mounts.
    
2. **Subscriptions and Cleanup**
    
    Set up and clean up listeners or services (e.g., WebSockets).
    
3. **Data Synchronization**
    
    Sync local state with external services or localStorage.
    

---

## 👶 Understanding `children` & Composition

### What is `props.children`?

- Dynamically pass elements/content from parent to child.

### Composition: A Better Approach

- Build complex components from simple ones.
- Avoid deep prop drilling by using children.

```jsx
jsx
CopiarEditar
const Father = () => {
  const sharedProp = 'Shared Info';
  return (
    <Child1>
      <Child2 sharedProp={sharedProp} />
    </Child1>
  );
};

const Child1 = ({ children }) => <div>{children}</div>;

const Child2 = ({ sharedProp }) => <div>{sharedProp}</div>;

```

### Benefits of Composition:

- ✅ Simpler code
- 📦 Reusable logic
- 📈 Scalable
- 🧠 Independent logic per component
- 🧼 No need for context/provider location

---

## 🌐 Using Context API

### What is Context?

- Share data between components **without passing props manually**.
- Great for global data: themes, user settings, auth, etc.

### Creating and Using Context:

```jsx
jsx
CopiarEditar
import { createContext, useContext, useState } from 'react';

export const GentlemanContext = createContext();

export const GentlemanProvider = ({ children }) => {
  const [gentlemanContextValue, setGentlemanContextValue] = useState('');
  return (
    <GentlemanContext.Provider value={{ gentlemanContextValue, setGentlemanContextValue }}>
      {children}
    </GentlemanContext.Provider>
  );
};

export const useGentlemanContext = () => {
  const context = useContext(GentlemanContext);
  if (context === undefined) {
    throw new Error('useGentlemanContext must be used within a GentlemanProvider');
  }
  return context;
};

```

### Advantages:

- 🧠 Understandable data flow
- 📈 Scalable structure
- 🔄 Centralized shared state

---

## 🧠 Essential React Hooks

### `useRef` – Persistent Value

- Mutable reference that **does not trigger re-renders**.
- Useful for DOM refs or tracking values across renders.

### `useMemo` – Memoize Expensive Calculations

- Only recalculates when dependencies change.
- Improves performance for **costly computations**.

### `useCallback` – Memoize Functions

- Keeps function references stable between renders.
- Avoids unnecessary re-renders in child components.

---

## 🌐 API Calls with Fetch

```
js
CopiarEditar
fetch('https://api.example.com/data')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error:', error));

```

### Key Concepts:

- **URL**: Endpoint address
- **Method**: GET (default), POST, PUT, DELETE...
- **Headers**: For tokens or content types
- **Body**: Data (usually in POST/PUT)

---

## 🔒 Local Storage & Security

- ❌ Don't store sensitive data (tokens, passwords).
- 🛡️ Vulnerable to **XSS attacks**.
- ✅ Store only **non-critical info** (theme, language).

---

## 🌀 React Portals

Useful when rendering outside normal DOM hierarchy:

- 🪟 Modals
- 🧭 Tooltips / Popovers
- 📋 Context menus

Avoids z-index, overflow, and positioning issues.

---

## 🎨 Styling Approaches in React

| Approach | Use Case | Simplicity | Maintenance | Performance |
| --- | --- | --- | --- | --- |
| Traditional CSS | Small/quick projects | High | Low | High |
| CSS-in-JS (Styled) | Component-based apps | Medium | High | Medium (runtime) |
| SCSS Modules | Encapsulated SCSS logic | Medium-High | High | High |

> 🐼 Note: Tools like Panda CSS offer build-time performance boosts.
> 

---

## 🦸 TypeScript: The Developer’s Superhero

- Adds **type safety** to JavaScript.
- Prevents common bugs during development.
- Transpiles into JavaScript at runtime.

> Like a superhero: active in dev, invisible in production.
> 

---

## 🌍 Framework Radar

### Astro

- **Static site generator** focused on performance.
- Integrates with React, Vue, Angular (Astro Islands).
- ⚠️ Limited job market, best for SEO/static sites.

### Next.js

- **React framework** with SSR + SSG.
- Hybrid for static & dynamic content.
- Built-in API routes, server components.
- ✅ Ideal for public apps, e-commerce, SEO.

---

## ⚙️ Performance & UX

- 🏎️ Google penalizes poor performance.
- 💡 Edge Computing is key (CDNs, serverless).
- 🧠 AI may tailor interfaces in real time (e.g., via TensorFlow.js).
- 💻 Frontend extends to **smart TVs**, **IoT**, **car dashboards**, etc.

> The future: frontend blurs with backend, design, and even AI.
> 

# 🚀 Mastering React – Summary for Notion

---

## 📐 Code Standards & Team Practices

### ✅ Establish Code Standards

- React is flexible, but that can lead to inconsistencies.
- Set **style and architecture guidelines** from the beginning.

### 🧠 Leverage the Community

- Participate in **forums, webinars, and conferences**.
- Stay up to date with best practices and trends.

### 🐢 Prioritize Quality Over Speed

- Implement **unit and integration tests** early.
- Focus on **robust and maintainable** code.

---

## 🧩 Correct useEffect Scenarios

1. **API Calls**
    
    Run async actions when the component mounts.
    
2. **Subscriptions and Cleanup**
    
    Set up and clean up listeners or services (e.g., WebSockets).
    
3. **Data Synchronization**
    
    Sync local state with external services or localStorage.
    

---

## 👶 Understanding `children` & Composition

### What is `props.children`?

- Dynamically pass elements/content from parent to child.

### Composition: A Better Approach

- Build complex components from simple ones.
- Avoid deep prop drilling by using children.

```jsx
jsx
CopiarEditar
const Father = () => {
  const sharedProp = 'Shared Info';
  return (
    <Child1>
      <Child2 sharedProp={sharedProp} />
    </Child1>
  );
};

const Child1 = ({ children }) => <div>{children}</div>;

const Child2 = ({ sharedProp }) => <div>{sharedProp}</div>;

```

### Benefits of Composition:

- ✅ Simpler code
- 📦 Reusable logic
- 📈 Scalable
- 🧠 Independent logic per component
- 🧼 No need for context/provider location

---

## 🌐 Using Context API

### What is Context?

- Share data between components **without passing props manually**.
- Great for global data: themes, user settings, auth, etc.

### Creating and Using Context:

```jsx
jsx
CopiarEditar
import { createContext, useContext, useState } from 'react';

export const GentlemanContext = createContext();

export const GentlemanProvider = ({ children }) => {
  const [gentlemanContextValue, setGentlemanContextValue] = useState('');
  return (
    <GentlemanContext.Provider value={{ gentlemanContextValue, setGentlemanContextValue }}>
      {children}
    </GentlemanContext.Provider>
  );
};

export const useGentlemanContext = () => {
  const context = useContext(GentlemanContext);
  if (context === undefined) {
    throw new Error('useGentlemanContext must be used within a GentlemanProvider');
  }
  return context;
};

```

### Advantages:

- 🧠 Understandable data flow
- 📈 Scalable structure
- 🔄 Centralized shared state

---

## 🧠 Essential React Hooks

### `useRef` – Persistent Value

- Mutable reference that **does not trigger re-renders**.
- Useful for DOM refs or tracking values across renders.

### `useMemo` – Memoize Expensive Calculations

- Only recalculates when dependencies change.
- Improves performance for **costly computations**.

### `useCallback` – Memoize Functions

- Keeps function references stable between renders.
- Avoids unnecessary re-renders in child components.

---

## 🌐 API Calls with Fetch

```
js
CopiarEditar
fetch('https://api.example.com/data')
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error('Error:', error));

```

### Key Concepts:

- **URL**: Endpoint address
- **Method**: GET (default), POST, PUT, DELETE...
- **Headers**: For tokens or content types
- **Body**: Data (usually in POST/PUT)

---

## 🔒 Local Storage & Security

- ❌ Don't store sensitive data (tokens, passwords).
- 🛡️ Vulnerable to **XSS attacks**.
- ✅ Store only **non-critical info** (theme, language).

---

## 🌀 React Portals

Useful when rendering outside normal DOM hierarchy:

- 🪟 Modals
- 🧭 Tooltips / Popovers
- 📋 Context menus

Avoids z-index, overflow, and positioning issues.

---

## 🎨 Styling Approaches in React

| Approach | Use Case | Simplicity | Maintenance | Performance |
| --- | --- | --- | --- | --- |
| Traditional CSS | Small/quick projects | High | Low | High |
| CSS-in-JS (Styled) | Component-based apps | Medium | High | Medium (runtime) |
| SCSS Modules | Encapsulated SCSS logic | Medium-High | High | High |

> 🐼 Note: Tools like Panda CSS offer build-time performance boosts.
> 

---

## 🦸 TypeScript: The Developer’s Superhero

- Adds **type safety** to JavaScript.
- Prevents common bugs during development.
- Transpiles into JavaScript at runtime.

> Like a superhero: active in dev, invisible in production.
> 

---

## 🌍 Framework Radar

### Astro

- **Static site generator** focused on performance.
- Integrates with React, Vue, Angular (Astro Islands).
- ⚠️ Limited job market, best for SEO/static sites.

### Next.js

- **React framework** with SSR + SSG.
- Hybrid for static & dynamic content.
- Built-in API routes, server components.
- ✅ Ideal for public apps, e-commerce, SEO.

---

## ⚙️ Performance & UX

- 🏎️ Google penalizes poor performance.
- 💡 Edge Computing is key (CDNs, serverless).
- 🧠 AI may tailor interfaces in real time (e.g., via TensorFlow.js).
- 💻 Frontend extends to **smart TVs**, **IoT**, **car dashboards**, etc.

### EL FUTURO DE FRONTEND

## ⚡ Focus on Performance and User Experience (UX)

---

## 🧠 AI-Driven Interfaces

- **AI + UX** = adaptive user interfaces.
- Tools like **TensorFlow.js** can dynamically:
    - Adjust font sizes (e.g., detecting eye strain).
    - Reorder layout sections based on scroll behavior.
- The line between **design and development is blurring** — AI may generate styles on the fly.

---

## 🖥️ Front-End Beyond the Browser

Front-end is now used in:

- 🧠 **Smart TVs**
- 📱 **IoT devices with web UIs**
- 🚗 **Car dashboards**
- 🧩 **PWAs & React Native apps**
- ⚙️ **Design systems & ML interfaces**

---

## 🌐 The Evolution Toward Unified Web Development

- Front-end today means more than HTML/CSS — it involves **accessibility**, **performance**, and **cross-platform UX**.
- The boundary between front-end, back-end, and design is **fading**.
- In the future, we may stop saying “front-end” and just say **web development**.

---

## 🛸 The Road Ahead

- The next 30 years will bring **unimaginable innovations**.
- New challenges will require the **creativity, adaptability, and passion** of developers.
- The web’s evolution is a **never-ending story** — and we are part of writing it.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 12. Clean Code — JavaScript Principles & Best Practices]]
- [[PROG 17. Refactoring — Eliminating Technical Debt & Code Smells]]
- [[PROG 15. React — Core Fundamentals & Component Architecture]]

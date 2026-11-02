# Technical Interview Questions

### What are the features of React?

JSX: Serves as a syntax extensions of JavaScript , facilitating the combination of HTML structures with js files within React files.

Components: Reusable, modular building blocks that encapsulate specific pieces of UI and functionality. They can be thought of as self-contained units that can be composed together to create complex user interfaces

Virtual DOM: A lightweight representation of the actual DOM stored in memory, this let React only update the relevant parts of the real DOM when the state of an object changes.

Data Binding: Unidirectional data flow signifies that in a React app , child components are often nested within parent components.

High Performance: Is driven by its ability to update only the components that undergo changes

### Whats the difference between element and component in React?

In React, an element is a plain object describing what you want to appear on the screen in terms of the DOM nodes or other components. Elements are immutable and can't change their attributes or behaviors.

![Untitled](Technical%20Interview%20Questions/Untitled.png)

On the other hand, a component can be declared in several different ways. It can either be a class with a render method, or in modern syntax, it can be a function that returns an element. Components can have their own state and can receive props from their parent components.

![Untitled](Technical%20Interview%20Questions/Untitled%201.png)

### What is the virtual DOM?

It´s a concept used by React to make updating changes more efficient.

![Untitled](Technical%20Interview%20Questions/Untitled%202.png)

 

### Explain the steps to create a React application a print a hello world

1. Install Node
2. Create React App (npx create-react-app my-react-app)
3. Run the app (npm start)

### Explain the difference between functional components and class components

Functional components are simple functions that accepts props and return JSX. They are stateless and don´t use constructors or React lifecycle methods.

Class components are ES6 classes that extend React.Component. They have render methods. They are suitable for managing state and implementing more complex logic.

Functional are preferred for simpler scenarios , while class components offer more features for complex state managements.

### What are React Hooks?

React Hooks are functions that let you hook into React state and lifecycle features from function components. They were introduced in React 16.8. Examples include useState and useEffect.

### What is useState()?

Is a fundamental React hook used to introduce state variables into functional components, especially when dynamic control over elements in the DOM is required.

### What is strict Mode in React?

React.strictMode() is a component designed to highlight potential issues and enforce best practices in React.

For the usage, wrap parts of the app in <React.StrictMode> to activate additional checks and warnings, it applys only in development mode to catch potential problems early.

### How is React different from Angular

![Untitled](Technical%20Interview%20Questions/Untitled%203.png)

### What are the four different phases of the component Lifecycle?

The four different phases of the component lifecycle refer to the stages a component goes through in a software or application. These phases typically include initialization, mounting (when the component is being created and inserted into the DOM), updating (when the component is being re-rendered as a result of changes to either its props or state), and unmounting (when the component is being removed from the DOM).

### What is React Router?

React Router is a powerful routing library built on top of React, which helps to add new screens and flows to your application incredibly quickly all while keeping the URL in sync with what's being displayed on the page. It maintains a standardized structure and behavior and is used for developing single page web applications. React Router has a simple API. It uses components structure to call components, which display the appropriate information.
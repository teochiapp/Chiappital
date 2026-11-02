# PROG 15. React — Core Fundamentals & Component Architecture

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

Es una librería creada por Facebook

Se utiliza para crear interfaces gráficas de usuario

Es una librería declarativa, muy simple

Soporta renderizado en el servidor, se puede extender fácilmente y está basada en componentes

### Instalación

creamos una carpeta y iniciamos el comando npx create-react-app “nombre”

npm start

### Directorio

La carpeta `src` es la que alberga todo el código de la aplicación, tanto en proyectos de React como de React Native.

`src` es la que alberga todo el código de la aplicación, tanto en proyectos de React como de React Native.

`public` tendrá los archivos públicos como imágenes, logos y json

`package.json` tendrá todas las dependencias instaladas

> <React.StrictMode> nos sirve para escribir codigo de calidad y que notifique errores o warnings
> 

### JSX

Sirve para que no tengamos que estar escribiendo constantemente React.createElement()

Las etiquetas se cierran con “/>”

Representa objetos llamados “Elementos de React”

Los elementos son los bloques más pequeños de las apps

React solo actualiza los elementos que son necesarios

### Componentes

Permiten separar la interfaz de usuario en piezas independientes. Aceptan entradas arbitrarias

Se declara como función o flecha

Siempre debe retornar algo. Acepta un argumento de objeto “props” con datos

### Props

```jsx
		//Defining the prop
	<img
      className="avatar"
      src={getImageUrl(person)}
      alt={person.name}
      width={size}
      height={size}
    />

function Avatar({ person, size }) {
  // person and size are available here
  return (
    <img
      className="avatar"
      src={getImageUrl(person)}
      alt={person.name}
      width={size}
      height={size}
    />
  );
}

```

In the typical React dataflow, props are the only way that parent components interact with their children. However, there are a few cases where you need to imperatively modify a child outside of the typical dataflow. The child to be modified could be an instance of a React component, or it could be a DOM element. For both of these cases, React provides an escape hatch.(useRef)

### Eventos

Se nombran usando CamelCase onClick= {function}

Siempre tienen la forma on + Nombre de evento

### Conditional Rendering:

```jsx
<Item 
    isPacked={true} 
    name="Helmet with a golden leaf" 
>
```

### Composition

React has a powerful composition model, and it is recommended to use composition instead of inheritance to reuse code between components. Always use it instead of Inheritance.

```jsx
import React from "react";
import Accordion from "./components/Accordion";

const App = () => {
  return (
    <>
      <Accordion header="Accordion 1">
        <div>Content for Accordion 1</div>
      </Accordion>
      <Accordion header="Accordion 2">
        <div>Content for Accordion 2</div>
      </Accordion>
      <Accordion header="Accordion 3">
        <div>Content for Accordion 3</div>
      </Accordion>
    </>
  );
};

export default App;
```

### React Router

React Router enables "client side routing".

```jsx
<Routes>
      <Route path="/" element={<div> Home page</div>} />
      <Route path="about" element= { <About /> } />
      <Route path="products" element= {<Products />} />
      <Route path="*" element= {<Error />} />
      <Route path="Dashboard" element= {<div>Dashboard</div>}>
        <Route path=""></Route>
      </Route>
    </Routes>
```

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 16. React — Context API & State Management]]
- [[PROG 14. Software Engineering — Gentleman Programming: Clean Architecture & Agile]]

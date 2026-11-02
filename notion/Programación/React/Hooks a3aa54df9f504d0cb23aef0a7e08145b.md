# Hooks

Son funciones que te permiten “enganchar” el estado de React y el ciclo de vida desde componentes funcionales. No funcionan dentro de las clases, usando React sin clases

## UseState

```jsx
const [state, setState] = useState(initialState);

//Devuelve un valor con estado y una función para actualizarlo

// Ejemplo
import React, { useState } from "react";

function Contador() {
  const [contador, setContador] = useState(0);

  return (
    <div>
      <h1>Contador: {contador}</h1>
      <button onClick={() => setContador(contador + 1)}>
        +1
      </button>
    </div>
  );
}

export default Contador;
```

## useEffect

Indicamos a React que el componente tiene que hacer algo luego de renderizarse

```jsx
import React, { useState, useEffect } from "react";

function Componente() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    // Llamamos a la API para cargar los datos
    fetch("/api/datos")
      .then((res) => res.json())
      .then((datos) => setDatos(datos));
  }, []);

  return (
    <div>
      <h1>Datos: {datos}</h1>
    </div>
  );
}

export default Componente;
```

## useContext

Puedes utilizar el hook `useContext` para compartir cualquier tipo de dato entre componentes. Por ejemplo, puedes usarlo para compartir el estado de una aplicación, la configuración de un componente o la información de un usuario.

```jsx
import React, { useState, useContext } from "react";

// App que sirve para compartir el estado entre componentes
// Contexto
const ThemeContext = createContext("light");

// Componente proveedor
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// Componente consumidor
function App() {
  const theme = useContext(ThemeContext);

  return (
    <div>
      <h1>Tema: {theme}</h1>
      <Button theme={theme}>Cambiar tema</Button>
    </div>
  );
}

// Componente botón
function Button({ theme }) {
  return (
    <button style={{ color: theme }}>Cambiar tema</button>
  );
}

export default App;
```

## useReducer

Puedes utilizar el hook `useReducer` para gestionar cualquier tipo de estado que requiera lógica compleja. Por ejemplo, puedes usarlo para gestionar el estado de un juego, el estado de un formulario o el estado de una aplicación.

```jsx
// Crear un carrito de compras

import React, { useReducer } from "react";

// Reducer
function reducer(state, action) {
  switch (action.type) {
    case "addItem":
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case "removeItem":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
}

// Componente
function Carrito() {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  return (
    <div>
      <h1>Carrito de compras</h1>
      <ul>
        {state.items.map((item) => (
          <li key={item.id}>{item.nombre}</li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: "addItem", payload: "Producto 1" })}>
        Agregar producto
      </button>
      <button onClick={() => dispatch({ type: "removeItem", payload: 1 })}>
        Eliminar producto
      </button>
    </div>
  );
}

export default Carrito;
```

## useCallback

Puedes utilizar el hook `useCallback` para evitar la reevaluación de cualquier función que realice una operación costosa. Por ejemplo, puedes usarlo para evitar la reevaluación de una función que realice una consulta a una API, una operación de cálculo compleja o una interacción con el DOM.

Ejemplo de cómo usar el hook `useCallback` para evitar la reevaluación de una función:

```jsx
import React, { useCallback } from "react";

function Componente() {
  const [contador, setContador] = useState(0);

  const incrementar = useCallback(() => {
    setContador(contador + 1);
  }, [contador]);

  return (
    <div>
      <h1>Contador: {contador}</h1>
      <button onClick={incrementar}>+1</button>
    </div>
  );
}

export default Componente;
```

Existen mas hooks como useMemo o useRef

### Reglas de Hooks

Llamarlos solo en el nivel superior, no dentro de ciclos, condicionales o funciones anidadas

Llama hooks solo en funciones de react, no desde funciones de Js Regulares

### Custom Hooks

Building your own Hooks lets you extract component logic into reusable functions.
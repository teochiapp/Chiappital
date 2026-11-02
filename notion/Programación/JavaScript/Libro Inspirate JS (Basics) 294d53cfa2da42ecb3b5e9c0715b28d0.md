# Libro Inspirate JS (Basics)

### ¿Qué se espera de un Front-End Junior?

- Conocimiento bueno de HTML5.
- Conocimiento bueno de CSS3.
- Bases de testing.
- Llamadas AJAX.
- Trabajo con librerías como JQuery.
- Conocimientos básicos de alguna librería MV*

### ¿Qué se espera de un Front-End Senior?

- Lo mismo que de un Junior, pero en mayor profundidad y con experiencia.
- Gestión de tareas Gulp, Grunt, etc…).
- Preprocesadores CSS.
- Trabajo con Flexbox.
- Dominio del desarrollo Responsive.
- Gestión de dependencias RequireJS, Webpack, Browsefy, etc..).
- Dominio/manejo fluido de un framework MV*.
- Conocimientos de Node.js.
- Conocimientos muy sólidos de JavaScript Patrones de diseño, ES6, etc..).
- Conocimientos avanzados sobre HTML5 APIs.
- Buenas prácticas (documentación, refactorización, etc…).

### ¿Qué se espera de un Back-End Junior?

- Conocimientos sólidos de programación (Algorítmia, lógica, etc…).
- Saber trabajar con bases de datos relacionales y/o no relacionales.
- Bases de una buena arquitectura (modularidad, microservicios, etc…).
- Bases de nuevas arquitecturas NoBackend, Serverless, WebSockets, etc…).
- Desarrollo de aplicaciones seguras.
- Conocimientos de protocolos como OAuth, HTTP (server side), etc..
- Al menos un lenguaje de programación con un buen nivel.
- Trabajar con fluidez con un motor de plantillas.
- Bases de HTML5 y CSS3.

### ¿Qué se espera de un Back-End Senior?

- Lo mismo que de un Junior, pero en mayor profundidad y con experiencia.
- Despliegue en Servidores y servicios en la nube.
- Al menos dos lenguajes de programación de Backend.
- Buen nivel de JavaScript.
- Bases de Node.js para la automatización Yeoman, Gulp, etc..).
- Bases de la Integración continua Jenkins, TravisCI, etc…).
- Experiencia con varias bases de datos diferentes.
- Gestión de cacheo Nginx, etc…).
- Creación de APIs.
- Integración con otras plataformas y servicios.
- Shell Scripting.

### Métodos de Consola:

- .assert(): Aparece un mensaje de error en la consola si la afirmación es falsa.
- .clear(): Limpia la consola.
- .dir(): Retorna una lista interactiva de las propiedades de un objeto.
- .dirxml(): Retorna una representación HTML del objeto.

### Notificadores

- .log(): Saca un mensaje por consola
- .info(): Saca un mensaje por consola con un estilo informativo.
- .warn(): Saca un mensaje por consola con un estilo alerta

### Interacción Básica con el Usuario

- Window.alert()

Muestra nuestro mensaje en una ventana.

- Window.confirm()

Pregunta al usuario y ofrece dos botones que setraducen en valores booleanos. Aceptar

(true) y cancelar o cerrar la ventana (false).

- Window.prompt()

Pregunta al usuario y permite la escritura devolviendo el mensaje.

Comoregla general, será imperativo utilizarlo siempre que comparemos entre valores el ===,

ya que debemos asegurarnos que no nos den “gato por liebre”, confirmando que son iguales

ambos datos en valor y tipo de dato.

### Operador Ternario

```jsx
condicion ? expresion1 : expresion2

var esMiembro = true;
console.info("El pago son " + (esMiembro ? "20.00€" : "50.00€"));
```

### Bucles

### While

El primer bucle que veremos está específicamente diseñado para funcionar de manera constante, mientras una condición dada siga cumpliéndose. Este bucle está pensado para simplificarnos la sintaxis cuando el control del bucle no se realiza mediante operaciones matemáticas (mayor que… menor que…).

```jsx
while (Condición) {
	Instrucciones
};
```

### For

Este bucle presenta una estructura optimizada para controlar la ejecución de la iteración de manera numérica. El bucle For se divide en tres partes separadas por un punto y coma

Expresión inicial: Será todo aquello que se ejecutará al iniciarse el bucle.

Condición: Será evaluada antes de cada iteración. Este es el único parámetro obligatorio.

Expresión de actualización: Se ejecutará al final de cada iteración.

Estructura:

```jsx
for (Expresión inicial; Condición; Expresión Actualización) {

		Instrucciones

};

(var i = 0; i < 10; i++) {
	console.log(i);
}
```

### Do… While

El tercer bucle que veremos en este capítulo es Do… While que se diferencia de todos los demás en que se ejecuta primero y se evalúa después. Al utilizar este bucle nos aseguramos que aunque la condición no se cumpla… el código se ejecuta al menos una vez.

```jsx
do{
	Instrucciones
} while (Condición);
```

### Break y Continue

- Continue: Nos permite saltar parte del bucle
- Break: Nos permite salir del bucle.

```jsx
for (var i = 0; i < 10; i++) {

// Salta el 5 y sigue...
	if (i === 5) {
		continue;
	}

// Llega a 5 y sale.
	if (i === 5) {
		break;
	}
console.log("El valor de i es "+i);
}
```

### Métodos

```jsx
.toExponential()
Retorna una cadena de texto con el valor de los números en formato de potencia.

var numObj = 77.1234;
console.log(numObj.toExponential()); // 7.71234e+1

.toFixed()
Retorna una cadena de texto con los números decimales.
Aunque no es la mejor forma, también podemos redondear el valor.

var numObj = 12345.6789;
numObj.toFixed(); //'12346' redondeo

Podemos alterar la longitud (número de decimales) con el argumento que pasamos al
método.

.toLocaleString()
Retorna una cadena con el valor representado en lenguaje local.

.toPrecision()
Devuelve un numero con los decimales deseados pero sin redondear.
var numero = 5.123456;
console.log(numero.toPrecision()); // 5.123456
console.log(numero.toPrecision(5)); // 5.1235
console.log(numero.toPrecision(2)); // 5.1

.toString()
Devuelve una cadena con el número en la base (hexadecimal, binaria…) que determinemos

.parseFloat()
Devuelve un número decimal o entero partiendo de una cadena.

.parseInt()
Devuelve un número entero partiendo de una cadena.
```

### Math

Math nos aporta infinidad de recursos matemáticos avanzados. En general, cuando necesitemos desarrollar una aplicación con un gran soporte matemático recurriremos a librerías como Mathjs.

```jsx
.round()
Devuelve el valor de un número redondeado al entero más cercano.
Math.round(20.5); // 21

.floor()
Devuelve el máximo entero menor o igual a un número.
Math.floor(20.5); // 20

.random()
Devuelve un número pseudo-aleatorio entre 0 y 1.
```

### Strings

.length(): Devuelve la longitud de la cadena, lo que resulta muy importante ya que podremos

utilizar bucles para recorrer cada una de las letras…

### Métodos

```jsx
.toLowerCase()
Devuelve todo en minúsculas.

.toUpperCase()
Devuelve todo en mayúsculas.

.fromCharCode()
Devuelve una cadena creada mediante una secuencia Unicode.

.anchor()
Crea un link interno (ancla) HTML.

.charAt()
Devuelve el carácter específico.

.charCodeAt()
Devuelve el valor Unicode.

.concat()
Combina el texto de dos o más cadenas.

.indexOf()
Devuelve la posición del elemento si es capaz de localizarlo o -1 en caso contrario.

.lastIndexOf()
Devuelve la ultima localización del elemento si es capaz de encontrarlo o -1 en caso
contrario.

.link()
Crea un enlace

.trim()
Elimina espacios vacíos al principio y al final de la cadena.

.slice()
Devuelve una cadena nueva con una sección de otra.

.split()
Divide una cadena usando un separador y retorna un array.

.substr()
Devuelve los caracteres de una cadena, comenzando en la localización especificada, y
en el número de caracteres especificado.

.substring()
Devuelve un subconjunto.
```

### Arrays

Los arrays son estructuras que nos permiten almacenar muchos datos, sin tener que preocuparnos por el orden o la organización interna.

### Métodos

![Untitled](Libro%20Inspirate%20JS%20(Basics)/Untitled.png)

```jsx
.forEach(): Se ejecuta la función por cada elemento del array.

function logger(element, index, array) {
	console.log("array[" + index + "] = " + element);
}
[2, 5, 9].forEach(logger);

.map(): Itera sobre el array aplicando una transformación, que definimos en una función y
finalmente retorna un nuevo array con todos los componentes modificados.

var arreglo = ["plátano", "fresa", "lima", "manzana"];
	var resultado = arreglo.map(function (elemento){return elemento + " modificado!\
"});
console.log(resultado);
```

### Objetos

Vamos a trabajar con Objetos (Objetos literales), básicamente son como arrays, en el sentido que son una variable especial que nos permite almacenar muchas cosas dentro de si misma

```jsx
Creando un objeto
// Vacío:
var miObjeto = {};

//Con propiedades:
var miObjeto = {
	cadena: 'esto es una cadena',
	numero: 2,
	booleano: false
};

//Con Métodos:
var miObjeto = {
	saludar: function(){
		console.log("hola!");
	}
};

//Cambiar un valor de una propiedad
var miObjeto = {
	propiedad1: "Datos"
};

miObjeto.propiedad1 = 123456789;
delete miObjeto.propiedad1;
```

### Métodos

- For… in: Itera sobre todas las propiedades de un objeto, en un orden arbitrario.

```jsx
var objeto1 = {
propiedad1: "hola",
propiedad2: 2,
propiedad3: false,
propiedad4: [true,2,5, "..."],
propiedad5: {
dato: "más datos..."
},
metodo: function(){
console.log("hola");
}
}

function mostrar_propiedades(objeto, nombreObjeto) {
var resultado = "";
for (var i in objeto) {
resultado += nombreObjeto + "." + i + " = " + objeto[i] + "\n";
}
return resultado;
}

mostrar_propiedades(objeto1, "objeto1");
```

### Funciones

Las funciones de JavaScript son el alma de este lenguaje, por eso se consideran ciudadanos de primera clase (first-class citizen), además de entidades de orden superior.

En JavaScript, las funciones tienen “super poderes”. Estos son algunos de los más importantes:

- Ser pasadas como parámetros (callbacks).
- Ser parte de los objetos como métodos.
- Ser asignadas a una variable (función anónima).
- Ser retornadas por otra función.

### Declaración

```jsx
Como sentencia:
function miFuncion (){
	console.log("Hola!")
}
Como valor de una variable:
var miFuncion = function(){
	console.log("Hola!")
}

Como método en un objeto:
var miObjeto = {
	propiedad: "Soy una propiedad",
	metodo: function(){
	console.log("Hola!")
	}
}
```

El orden de los parámetros:

- Parámetros fijos (primero).
- Parámetros opcionales (después).

Una **expresión de función flecha** es una alternativa compacta a una `expresión de función` tradicional, pero es limitada y no se puede utilizar en todas las situaciones.

- No tiene sus propios enlaces a `this` o `super` y no se debe usar como [métodos](https://developer.mozilla.org/es/docs/Glossary/Method).
- No tiene `argumentos` o palabras clave `new.target`.
- No apta para los métodos `call`, `apply` y `bind`, que generalmente se basan en establecer un [ámbito o alcance](https://developer.mozilla.org/es/docs/Glossary/Scope)
- No se puede utilizar como [constructor](https://developer.mozilla.org/es/docs/Glossary/Constructor).
- No se puede utilizar `yield` dentro de su cuerpo.

```jsx
// Función tradicional
function (a, b){
  return a + b + 100;
}

// Función flecha
(a, b) => a + b + 100;

// Función tradicional (sin argumentos)
let a = 4;
let b = 2;
function (){
  return a + b + 100;
}

// Función flecha (sin argumentos)
let a = 4;
let b = 2;
() => a + b + 100;
```

### Callbacks

Esto quiere decir, que cuando cierta función termina de realizar todo lo que tiene que hacer, ejecutará una función que le fue pasada como argumento.

Cuando en JavaScript se habla de asincronía, lo que realmente está ocurriendo es que dejamos de ejecutar partes de nuestro script de manera secuencial. Esto crea un efecto curioso que tiene como consecuencia, un script muy escalable y rápido, ya que el sistema no espera a que algo termine para seguir ejecutando el resto del script.

Existen muchas formas de manejar la asincronía.

- Paso de continuadores (Callbacks).
- Eventos.
- Promesas (ECMA6 y librerías…).
- Generadores (ECMA6, Closures, etc…).

```jsx
function traigoDatos (){
// Asincrona
	setTimeout (function(){
		console.log ("Esto son mis datos");
	},2000)
}

function pintoDatos(){
// No asincrona
 console.log("ya tengo los datos");
}

traigoDatos();
pintoDatos()
```

## Web dinámica y conectada

![Untitled](Libro%20Inspirate%20JS%20(Basics)/Untitled%201.png)

window.history: Nos permite manipular el historial de la sesión actual, eso incluye solamente las páginas visitadas con la pestaña actual.

```jsx
1 // Ir atrás
history.length, 
history.go(-1);
history.back();

// Ir adelante
history.go(1);
history.forward();
```

window.screen: Esta API nos permite sacar toda la información disponible de la pantalla

```jsx
1 console.log("availTop:", window.screen.availTop);
2 console.log("availLeft:", window.screen.availLeft);
3 console.log("availHeight:", window.screen.availHeight);
4 console.log("availWidth:", window.screen.availWidth);
5 console.log("colorDepth:", window.screen.colorDepth);
6 console.log("height:", window.screen.height);
7 console.log("left:", window.screen.left);
8 console.log("orientation:", window.screen.orientation);
9 console.log("pixelDepth:", window.screen.pixelDepth);
10 console.log("top:", window.screen.top);
11 console.log("width:", window.screen.width);
```

### DOM

El modelo de objeto de documento (DOM) es una interfaz de programación para los documentos HTML y XML

Una página web es un documento. Éste documento puede exhibirse en la ventana de un navegador o también como código fuente HTML.

### Selectores

El primer paso para poder manipular el DOM, es adquirir cierta destreza en el manejo de los selectores

- Node.childNodes
- document.querySelectorAll

```jsx
Selectores tradicionales

• .getElementById()
Permite la selección de un elemento por su id.
// <div id="miDiv"></div>
document.getElementById("miDiv");
• .getElementsByName()
Permite la selección de varios elementos por su atributo name.
// <form name="miForm"></form>
document.getElementsByName("miForm");
• .getElementsByTagName()
Permite la selección de varios elementos por su etiqueta.
// <input>
document.getElementsByTagName("input");
• .getElementsByClassName()
Permite la selección de varios elementos por su clase.
// <div class="rojo"></div>
document.getElementsByClassName("rojo");

.querySelector()
Devuelve el primer elemento que coincida con el selector.
.querySelectorAll()
Devuelve todos los elementos que coincidan con el selector en un pseudo-array.

CSS
window.getComputedStyle(document.getElementById("id")); // Leer
1 document.body.style.display="none" // Cambiar
```

### Alterando el DOM

```jsx
//Métodos esenciales
• .textContent: Nos devuelve el texto de un elemento previamente seleccionado.
• .classList.contains(): Verifica si contiene cierta clase
• .classList.add(): Permite añadir una clase al elemento
• .classList.remove(className): Permite eliminar una clase del elemento
• .style.display: Nos permite conocer y modificar la visualización de un elemento concreto.
• .cloneNode(): Permite clonar un nodo y clonar o no, sus nodos hijo también.
• .innerHTML: Cambia o devuelve la sintaxis HTML de un elemento… así como de sus
hijos.
• .getAttribute(): Devolver el valor de cierto atributo o una cadena vacía en caso de no existir.
• .setAttribute(): Cambiar el valor de un atributo o lo añade si no existe.
```

### Eventos

Existen dos formas básicas de añadir eventos a nuestra aplicación. Una es por medio de html con atributos como onclick, y la otra desde el JavaScript, haciendo uso de métodos como .addEventListener().

```jsx
<body onclick="cambiarFondo()"></body>

function cambiarFondo() {
// color = 'rgb(0-255,0-255,0-255)'
	var color = 'rgb(' + Math.floor((Math.random() * 255))+ ',';
	color += Math.floor((Math.random() * 255)) + ',';
	color += Math.floor((Math.random() * 255)) + ')';
	document.body.style.backgroundColor= color;
	console.info("Nuevo color:", color);
}

Veamos como funciona con addEventListener().
document.body.addEventListener('click', function (e) {
var color = 'rgb(' + Math.floor((Math.random() * 255))+ ',';
	color += Math.floor((Math.random() * 255)) + ',';
	color += Math.floor((Math.random() * 255)) + ')';
	document.body.style.backgroundColor= color;
	console.info("Nuevo color:", color);
});
document.body.removeEventListener('click', cambiarColor);
```

![Untitled](Libro%20Inspirate%20JS%20(Basics)/Untitled%202.png)

Capturing: Recorre todo el documento desde document hasta el elemento en sí.

Target: Es cuando se llega al elementos en cuestión.

Bubbling: Realiza el recorrido de vuelta hacía arriba desde el elemento en sí.

## AJAX

Entendiendo HTTP/s: La parte clave a la hora de entender este protocolo, es que sigue un esquema peticiónrespuesta entre cliente y servidor, que hace quetengamos querefrescar la página para poder recibir la nueva información. Tal como funcionaba la web a principios del dos mil…

Línea inicial

- En la petición se especifica el método utilizado.
- En la respuesta se especifica un código de respuesta.

Cabecera

- Podremos encontrar todos los metadatos propios de la petición y la respuesta.

Cuerpo

- Esta parte es opcional y contiene por ejemplo html, css… textos planos, lo que sea en
- si el mensaje desde el servidor, así como desde el cliente.

### Métodos

Los métodos más utilizados son GET, POST (típico de formularios), PUT y DELETE.

Estos códigos de estado pueden dividirse en cinco categorías principales:

- 1xx Informativas.
- 2xx Peticiones Correctas.
- 3xx Redirecciones.
- 4xx Errores Cliente.
- 5xx Errores Servidor.

Siendo especialmente importantes para nosotros, los 4xx y los 5xx, ya que nos indican

errores que están sucediendo y esto seguramente derive en un tráfico de datos erróneo.

### Trabajando con APIs

- API
- REST
- SOAP

Las API REST: Esto permite conseguir datos (peticiones GET), actualizar datos (peticiones PUT), crear nuevos datos (peticiones POST) y eliminar datos (peticiones Delete)

```
Petición GET a api.loremblog.com/posts
Nos devuelve un JSON con todos los post disponibles.
Petición POST a api.loremblog.com/posts
Nos crea una nueva entrada en la base de datos, con los datos en JSON que le hemos
pasado
Petición PUT a api.loremblog.com/posts/hello
Nos permite actualizar la entrada (numero/nombre hello) con los datos JSON que
hemos pasado.
Petición DELETE a api.loremblog.com/posts/hello
Nos permite borrar la entrada (numero/nombre hello).
```

### Peticiones AJAX

```jsx
El navegador nos aporta dos formas básicas de interactuar con datos JSON.
• JSON.parse()
Que analiza la cadena JSON, validándola y retornando los valores como un dato válido
de JavaScript. Lo más habitual es un objeto o array.

var objeto = JSON.parse('{"test": true}');
var lista = JSON.parse('[true, "NO", 23]');
var booleano = JSON.parse('false');
var texto = JSON.parse('"cadena!"');

• JSON.stringify()
Analiza los valores y retorna una cadena en formato JSON.
```

### Peticiones

La mecánica de las peticiones es realmente sencilla. Simplemente necesitamos saber a que URL vamos a realizar la petición, que método vamos a utilizar (GET, POST, PUT o DELETE) y con que función (callback) manejaremos los datos de vuelta.

```jsx
$.ajax({
	dataType: "json",
	url: "<---URL---->",
})

.done(function( data, textStatus, jqXHR ) {
	console.log( "La solicitud se ha completado correctamente." );
	console.log( data );
})
.fail(function( jqXHR, textStatus, errorThrown ) {
	console.log( "La solicitud a fallado: " + textStatus);
});
```

No recargamos pero somos asíncronos.

![Untitled](Libro%20Inspirate%20JS%20(Basics)/Untitled%203.png)

Como puedes ver, ya no es necesario recargar la página como antes, ya que el navegador se encargade hacer la petición y gestionarla en un segundo plano

Para poder realizar peticiones Ajax, de manera nativa, los navegadores implementan un objeto desde el que podremos realizar las peticiones, llamado XMLHttpRequest.
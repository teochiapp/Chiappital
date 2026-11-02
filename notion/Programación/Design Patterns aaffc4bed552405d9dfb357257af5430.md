# Design Patterns

**Patrones creacionales**

[Factory Method](Design%20Patterns/Factory%20Method%20ca03b8e2ddf94006a537d359efcd3a74.md)

[Abstract Factory](Design%20Patterns/Abstract%20Factory%202496fd429da84624b37a3bfb6e493bd8.md)

[Builder](Design%20Patterns/Builder%2084ffdd7c97c94edf8652ed92a3a353b1.md)

[**Prototype**](Design%20Patterns/Prototype%201ab089a546a148a7960f9abd91a92bbe.md)

[**Singleton**](Design%20Patterns/Singleton%20ae86f74ccbf74e3094b137e4ae590ed0.md)

Patrones estructurales

Patrones de estructuramiento

Los **patrones de diseño** son soluciones habituales a problemas que ocurren con frecuencia en el diseño de software. Son como planos prefabricados que se pueden personalizar para resolver un problema de diseño recurrente en tu código.

El patrón no es una porción específica de código, sino un concepto general para resolver un problema particular.

Una analogía de un algoritmo sería una receta de cocina: ambos cuentan con pasos claros para alcanzar una meta. Por su parte, un patrón es más similar a un plano, ya que puedes observar cómo son su resultado y sus funciones,

- El **propósito** del patrón explica brevemente el problema y la solución.
- La **motivación** explica en más detalle el problema y la solución que brinda el patrón.
- La **estructura** de las clases muestra cada una de las partes del patrón y el modo en que se relacionan.
- El **ejemplo de código** en uno de los lenguajes de programación populares facilita la asimilación de la idea que se esconde tras el patrón.

Este es el problema que persigue a muchos principiantes que acaban de familiarizarse con los patrones. Una vez que aprenden sobre patrones, intentan aplicarlos en todas partes, incluso en situaciones en las que un código más simple funcionaría perfectamente bien.

- Los **patrones creacionales** proporcionan mecanismos de creación de objetos que incrementan la flexibilidad y la reutilización de código existente.
- Los **patrones estructurales** explican cómo ensamblar objetos y clases en estructuras más grandes a la vez que se mantiene la flexibilidad y eficiencia de la estructura.
- Los **patrones de comportamiento** se encargan de una comunicación efectiva y la asignación de responsabilidades entre objetos.

### Pillars of OOP

Object-oriented programming is based on four pillars, concepts that differentiate it from other programming paradigms

### Abstraction

Abstraction is a model of a real-world object or phenomenon, limited to a specific context, which represents all details relevant to this context with high accuracy and omits all the rest

### Encapsulation

We often often use this concept to hide an object’s internal representation or state from the outside. This is called [information hiding](https://en.wikipedia.org/wiki/Encapsulation_(computer_programming)#An_information-hiding_mechanism).

If you’re familiar with any object-oriented programming language, you probably know these methods as getter and setter methods. As the names indicate, a getter method retrieves an attribute and a setter method changes it. Depending on the methods that you implement, you can decide if an attribute can be read and changed.

### Inheritance

![Untitled](Design%20Patterns/Untitled.png)

Inheritance is the ability to build new classes on top of existing ones.

The main benefit of inheritance is code reuse. If you want to create a class that’s slightly different from an existing one, there’s no need to duplicate code.

### Polymorphism

![Untitled](Design%20Patterns/Untitled%201.png)

Polymorphism is the ability of a program to detect the real class of an object and call its implementation even when its real type is unknown in the current context.

### SOFTWARE DESIGN PRINCIPLES

### Features of Good Design

Code Reuse: One of the most common ways to reduce development costs.

The intent is pretty obvious: instead of developing something over and over from scratch, why don’t we reuse existing code in new projects?

Extensibility: Change is the only constant thing in a programmer’s life.

- You released a video game for Windows, but now people ask for a macOS version.
- You created a GUI framework with square buttons, but several months later round buttons become a trend.
- You designed a brilliant e-commerce website architecture, but just a month later customers ask for a feature that would let them accept phone orders

There’s a bright side: if someone asks you to change something in your app, that means someone still cares about it.

## Design Principles

### Encapsulates What Varies:

Identify the aspects of your application that vary and separate them from what stays the same.

The main goal of this principle is to minimize the effect caused by changes.

Identify the aspects of your application that vary and separate them from what stays the same.

The main goal of this principle is to minimize the effect caused by changes.

```jsx
BEFORE: tax calculation code is mixed with the rest of the method’s code.

1 method getOrderTotal(order) is
2 total = 0
3 foreach item in order.lineItems
4 total += item.price * item.quantity
5
6 if (order.country == "US")
7 total += total * 0.07 // US sales tax
8 else if (order.country == "EU"):
9 total += total * 0.20 // European VAT
10
11 return total

AFTER: you can get the tax rate by calling a designated method.

1 method getOrderTotal(order) is
2 total = 0
3 foreach item in order.lineItems
4 total += item.price * item.quantity
5
6 total += total * getTaxRate(order.country)
7
8 return total
9
10 method getTaxRate(country) is
11 if (country == "US")
12 return 0.07 // US sales tax
13 else if (country == "EU")
14 return 0.20 // European VAT
15 else
16 return 0
```

### Program to an Interface, not an Implementation

Program to an interface, not an implementation. Depend on abstractions, not on concrete classes.

You can tell that the design is flexible enough if you can easily extend it without breaking any existing code.

![Untitled](Design%20Patterns/Untitled%202.png)

### Favor Composition Over Inheritance

Inheritance is probably the most obvious and easy way ofreusing code between classes. You have two classes with the same code. Create a common base class for these two and move the similar code into it. Piece of cake!

Unfortunately, inheritance comes with caveats that often become apparent only after your program already has tons of classes and changing anything is pretty hard. Here’s a list of those problems.

- A subclass can’t reduce the interface of the superclass. You have to implement all abstract methods of the parent class even if you won’t be using them.
- When overriding methods you need to make sure that the new behavior is compatible with the base one
- Inheritance breaks encapsulation of the superclass because the internal details of the parent class become available to the subclass
- Subclasses are tightly coupled to superclasses. Any change in a superclass may break the functionality of subclasses.
- Trying to reuse code through inheritance can lead to creating parallel inheritance hierarchies

There’s an alternative to inheritance called composition.

Whereas inheritance represents the “is a” relationship between classes (a car is a transport), composition represents the “has a” relationship (a car has an engine).

Here’s an example: a car has a driver, but he or she may use another car or just walk without the car

## SOLID PRINCIPLES

SOLID is a mnemonic for five design principles intended to make software designs more understandable, flexible and maintainable.

The cost of applying these principles into a program’s architecture might be making it more complicated than it should be. I doubt that there’s a successful software product in which all of these principles are applied at the same time.

### Single Responsibility Principle

### Open/Closed Principle

### Liskov Substitution Principle

### Interface Segregation Principle

### Dependency Inversion Principle
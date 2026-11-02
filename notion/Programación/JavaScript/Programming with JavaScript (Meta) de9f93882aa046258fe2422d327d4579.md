# Programming with JavaScript (Meta)

Luckily, you can use the fact that a for of loop can be run on arrays *to loop over objects*.

You first need to review three built-in methods: **Object.keys()**, **Object.values()**, and **Object.entries()**.

**The Object.keys() method**

```jsx
const car2 = {
    speed: 200,
    color: "red"
}
console.log(Object.keys(car2)); // ['speed','color']
```

**The Object.values() method**

```jsx
const car3 = {
    speed: 300,
    color: "yellow"
}
console.log(Object.values(car3)); // [300, 'yellow']
```

**The Object.entries() method**

```jsx
const car4 = {
    speed: 400,
    color: 'magenta'
}
console.log(Object.entries(car4)); // [ ['speed', 400], ['color', 'magenta'] ]
```

You now have all the ingredients that you need to **loop over any object's own property keys and values**.

```jsx
var clothingItem = {
    price: 50,
    color: 'beige',
    material: 'cotton',
    season: 'autumn'
}

for( key of Object.keys(clothingItem) ) {
    console.log(keys, ":", clothingItem[key])
}
```

Before you think about the code solution, you need to know need to think about the way you represent the data.

### **Working with arrays in JavaScript**

In this reading, the focus is on three specific methods that exist on arrays:

1. **forEach**
2. **filter**
3. **map**

Arrays in JavaScript come with a handy method that allows you to loop over each of their members.

### The **filter()** method

Another very useful method on the array is the **filter()** method. It filters your arrays **based on a specific test**. Those array items that pass the test are returned.

```jsx
const nums = [0,10,20,30,40,50];
nums.filter( function(num) {
    return num > 20;
})
```

### The **map** method

Finally, there's a very useful **map** method.

```jsx
[0,10,20,30,40,50].map( function(num) {
    return num / 10
})
// [0,1,2,3,4,5]
```

## Working with Maps in JavaScript

To make a new Map, you can use the **Map** constructor:

new Map();

```jsx
let bestBoxers = new Map();
bestBoxers.set(1, "The Champion");
bestBoxers.set(2, "The Runner-up");
bestBoxers.set(3, "The third place");

console.log(bestBoxers);
Map(3) {1 => 'The Champion', 2 => 'The Runner-up', 3 => 'The third place'}
bestBoxers.get(1); // 'The Champion'
```

## Working with Sets in JavaScript

A set is a collection of unique values.

To build a new set, you can use the **Set** constructor:

new Set();

```
new Set();
const repetitiveFruits = ['apple','pear','apple','pear','plum', 'apple'];
const uniqueFruits = new Set(repetitiveFruits);
console.log(uniqueFruits);
```

Some more advanced data structures that have not been covered include:

- Queues
- Linked lists (singly-linked and doubly-linked)
- Trees
- Graphs

## Spread Operator

Think of the spread operator as a magical multi-purpose tool that can spread out array items and join objects together. 

## Rest Operator

The **rest parameter** syntax allows a function to accept an indefinite number of arguments as an array, providing a way to represent [variadic functions](https://en.wikipedia.org/wiki/Variadic_function) in JavaScript.

```jsx
const fruits = ['apple', 'pear', 'plum']
const berries = ['blueberry', 'strawberry']
const fruitsAndBerries = [...fruits, ...berries] // concatenate
console.log(fruitsAndBerries); // outputs a single array
// ['apple', 'pear', 'plum', 'blueberry', 'strawberry']
```

Joining objects:

```jsx
const flying = { wings: 2 }
const car = { wheels: 4 }
const flyingCar = {...flying, ...car}
console.log(flyingCar) // {wings: 2, wheels: 4}
```

Separating array objects:

```jsx
const greeting = "Hello";
const arrayOfChars = [...greeting];
console.log(arrayOfChars); //  ['H', 'e', 'l', 'l', 'o']
```

**Copy either an object or an array into a separate one**

```jsx
const car1 = {
    speed: 200,
    color: 'yellow'
}
const car 2 = {...car1}

car1.speed = 201

console.log(car1.speed, car2.speed)
```

# JSON.stringify()

El método **`JSON.stringify()`** convierte un objeto o valor de JavaScript en una cadena de texto JSON, opcionalmente reemplaza valores si se indica una función de reemplazo, o si se especifican las propiedades mediante un array de reemplazo.

# Testing

Which of the following is a correct example of a Jest test?

```jsx
**expect(concatStrings("123", "456")).toBe("123456");**
```

Testing code in this way ensures three things. 

Conciseness as it's straightforward and to the point, since there are only two function calls to explain what is the expected result. 

Clarity, because you know exactly what arguments you're providing, 

and Repeatability, as you can run it again and again with the same arguments each time.

To sum up, testing is how you verify the expectations you have regarding the behavior of your code.

The act of confirming that it works as outlined in the software's requirements.

### Testing Types

- E2E: In other words, you're testing the entire finished software product from the perspective of the end user. Finally, E two E tests are the slowest and take the most time to set up and run
- Integration: Integration testing is testing how parts of your system interact with other parts of your system.
- Unit test: Unit testing is the process of testing the smallest units of your source code in isolation. A good example of this is functions. A unit is the smallest piece of code that you can test separately from the rest of the app. Practically the smallest unit of testable code in Js is usually a function or a method.

# JEST

Testing Framework

Code Coverage: Percentage of my code covered my tests

Mocking: Separating code from related dependencies during testing. This allow remove the bottleneck between frontend and backend.

Snapshot testing: Used by web developers to verify that there are no regressions in the DOM

### Test Driven Development

This process is usually explained in three words. Red, Green and Refactor, 

Red represents the failing test. Green on the other hand, represents the passing test after you make updates to the source code. The refactor represents the final tweaks to the code that don't change implementation details, which can always be confirmed by running another subsequent test when implemented correctly. 

TDD brings huge benefits to an organization because it allows for automated testing in any platform projects grow bigger over time and become complex.
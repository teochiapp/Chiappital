# Clean Code Javascript

[https://github.com/ryanmcdermott/clean-code-javascript](https://github.com/ryanmcdermott/clean-code-javascript)

Software engineering principles, from Robert C. Martin's book [*Clean Code*](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882), adapted for JavaScript. This is not a style guide. It's a guide to producing [readable, reusable, and refactorable](https://github.com/ryanmcdermott/3rs-of-software-architecture) software in JavaScript.

## **Variables**

### Use meaningful and pronounceable variable names

**Bad:**

const yyyymmdstr = moment().format("YYYY/MM/DD");

**Good:**

`const currentDate = moment().format("YYYY/MM/DD");`

### Use the same vocabulary for the same type of variable

**Bad:**

```jsx
getUserInfo();
getClientData();
getCustomerRecord();
```

**Good:**

```jsx
getUser();
```

### Use searchable names

We will read more code than we will ever write. It's important that the code we do write is readable and searchable. By *not* naming variables that end up being meaningful for understanding our program, we hurt our readers. Make your names searchable. Tools like [buddy.js](https://github.com/danielstjules/buddy.js) and [ESLint](https://github.com/eslint/eslint/blob/660e0918933e6e7fede26bc675a0763a6b357c94/docs/rules/no-magic-numbers.md) can help identify unnamed constants.

**Bad:**

```jsx
// What the heck is 86400000 for?
setTimeout(blastOff, 86400000);
```

**Good:**

```jsx
// Declare them as capitalized named constants.
const MILLISECONDS_PER_DAY = 60 * 60 * 24 * 1000; //86400000;

setTimeout(blastOff, MILLISECONDS_PER_DAY);
```
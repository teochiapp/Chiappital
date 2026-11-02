# PROG 07. CSS — BEM Methodology & Modular Architecture

> 📌 **Categoría:** [[Programación]] | **Área:** Programming
> 🏷️ **Dominio:** Ingeniería de Software y Desarrollo Fullstack

BEM (Block, Element, Modifier) is a component-based approach to web development. The idea behind it is to divide the user interface into independent blocks. This makes interface development easy and fast even with a complex UI, and it allows reuse of existing code without copying and pasting.

**Block**

The [block name](https://en.bem.info/methodology/naming-convention/#block-name) describes its purpose ("What is it?" — menu or button), not its state ("What does it look like?" — red or big).

- The block shouldn't influence its environment, meaning you shouldn't set the external geometry (margin) or positioning for the block.
- You also shouldn't use CSS tag or ID selectors when using BEM.

**Nesting**

- Blocks can be nested in each other.
- You can have any number of nesting levels.

**Element**

A composite part of a block that can't be used separately from it.

- The [element name](https://en.bem.info/methodology/naming-convention/#element-name) describes its purpose ("What is this?" — item, text, etc.), not its state ("What type, or what does it look like?" — red, big, etc.).
- The structure of an element's full name is block-name__element-name. The element name is separated from the block name with a double underscore (__).

### **Key-value**

- Used when the modifier value is important. For example, "a menu with the islands design theme": menu_theme_islands.
- The structure of the modifier's full name follows the pattern:
    - block-name_modifier-name_modifier-value
    - block-name__element-name_modifier-name_modifier-value

From the BEM perspective, a modifier can't be used in isolation from the modified block or element. A modifier should change the appearance, behavior, or state of the entity, not replace it.

![BEM Block Overview](/uploads/prog-css-bem-1.png)

![BEM Element Structure](/uploads/prog-css-bem-2.png)

![BEM Modifiers](/uploads/prog-css-bem-3.png)

![BEM Component Decomposition](/uploads/prog-css-bem-4.png)

![BEM Clean Hierarchy](/uploads/prog-css-bem-5.png)

The final implementation of a block can be divided into different redefinition levels

### **Naming rules**

**block-name__elem-name_mod-name_mod-val**

- Names are written in lowercase Latin letters.
- Words are separated by a hyphen (-).
- The block name defines the [namespace](https://en.wikipedia.org/wiki/Namespace) for its elements and modifiers.
- The element name is separated from the block name by a double underscore (__).
- The modifier name is separated from the block or element name by a single underscore (_).
- The modifier value is separated from the modifier name by a single underscore (_).
- For boolean modifiers, the value is not included in the name.

**Important:** Elements of elements [do not exist in the BEM methodology](https://en.bem.info/methodology/faq/#why-not-create-elements-of-elements-block__elem1__elem2). The naming rules do not allow creating elements of elements, but you can nest elements inside each other in the DOM tree.

*/* Block component */*

.btn {}

*/* Element that depends upon the block */*

.btn__price {}

*/* Modifier that changes the style of the block */*

.btn--orange {}

.btn--big {}

it is extraordinarily useful for constructing scalable and maintainable interfaces where everyone on the team should have a clear idea of how things can be improved. This is because a great deal of front end development is not just about the nice tricks that solve one little problem in the short term; we need agreements, promises and binding social contracts between developers so that our codebase can adapt over time.

---

### 🔗 Conexiones & Referencias en el Grafo
- **Índice Principal:** [[PROG 00. Software Engineering & Programming — Master Roadmap & Knowledge Base]]
- [[PROG 05. CSS — Master Architecture & Modern Styling Guide]]
- [[PROG 12. Clean Code — JavaScript Principles & Best Practices]]

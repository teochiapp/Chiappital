# Libro Eloquent Javascript

*But the computer is not really like us. It is a projection of a very slim part of ourselves: that portion devoted to logic, order, rule, and clarity.”*

*When action grows unprofitable, gather information; when information grows unprofitable, sleep.*

### ***PART I: LANGUAGE***

*People think that computer science is the art of geniuses but the actual reality is the opposite, just many people doing things that build on each other, like a wall of mini stones.”*

F*unctions can help organize a program by grouping code into pieces that do specific things.*

*Objects and arrays (which are a specific kind of object) provide ways to group several values into a single value. Conceptually, this allows us to put a bunch of related things in a bag and run around with the bag, instead of wrapping our arms around all of the individual things and trying to hold on to them separately.*

*Objects tend to use names for their properties and store more or less a fixed set of them. Arrays, on the other hand, usually contain varying amounts of conceptually identical values and use numbers (starting from 0) as the names of their properties.*

*Objects tend to use names for their properties and store more or less a fixed set of them. Arrays, on the other hand, usually contain varying amounts of conceptually identical values and use numbers (starting from 0) as the names of their properties.*

*Abstractions hide details and give us the ability to talk about problems at a higher (or more abstract) level.*

*There is a built-in array method, forEach, that provides something like a for/of loop as a higher-order function.*

*Arrays provide a number of useful higher-order methods. You can use forEach to loop over the elements in an array. The filter method returns a new array containing only the elements that pass the predicate function. Transforming an array by putting each element through a function is done with map. You can use reduce to combine all the elements in an array into a single value.*

*The some method tests whether any element matches a given predicate function. And findIndex finds the position of the first element that matches a predicate.*

*The core idea in object-oriented programming is to divide programs into smaller pieces and make each piece responsible for managing its own state.*

*A map (noun) is a data structure that associates values (the keys) with other values. For example, you might want to map names to ages. It is possible to use objects for this. let ages    = {   Boris:   39,   Liang:   22,   Júlia:   62};*

*A map (noun) is a data structure that associates values (the keys) with other values. For example, you might want to map names to ages. It is possible to use objects for this. let ages    = {   Boris:   39,   Liang:   22,   Júlia:   62};*

*The use of the word extends indicates that this class shouldn’t be directly based on the default Object prototype but on some other class. This is called the superclass. The derived class is the subclass.*

*It is occasionally useful to know whether an object was derived from a specific class. For this, JavaScript provides a binary operator called instanceof.*

*Static methods are methods stored in a class’s constructor, rather than its prototype.*

*A module is a piece of program that specifies which other pieces it relies on and which functionality it provides for other modules to us*

*The relations between modules are called dependencies . When a module needs a piece from another module, it is said to depend on that module.*

*One aspect of module design is ease of use. If you are designing something that is intended to be used by multiple people—or even by yourself, in three months when you no longer remember the specifics of what you did—it is helpful if your interface is simple and predictable.*

*A package is a chunk of code that can be distributed on its own. NPM is a repository of JavaScript packages. You can download all kinds of useful (and useless) packages from it.*

*An asynchronous model allows multiple things to happen at the same time. When you start an action, your program continues to run. When the action finishes, the program is informed and gets access to the result*

*As an example, the setTimeout function, available both in Node.js and in browsers, waits a given number of milliseconds (a second is a thousand milliseconds) and then calls a function. setTimeout(() => console.log("Tick"), 500);*

*The defineRequestType function defines a new type of request. The example adds support for "note" requests, which just sends a note to a given nest*

*The fourth argument given to the handler, done, is a callback function that it must call when it is done with the request*

*A promise is an asynchronous action that may complete at some point and produce a value. It is able to notify anyone who is interested when its value is available.*

*let fifteen = Promise.resolve(15);fifteen.then(value => console.log(`Got ${value}`));// → Got 15*

*This asynchronous function returns a meaningful value. This is the main advantage of promises—they simplify the use of asynchronous functions. Instead of having to pass around callbacks, promise-based functions look similar to regular ones: they take input as arguments and return their output*

*Much like an uncaught exception is handled by the environment, JavaScript environments can detect when a promise rejection isn’t handled and will report this as an error.*

*The good news is that JavaScript allows you to write pseudo-synchronous code to describe asynchronous computation. An async function is a function that implicitly returns a promise and that can, in its body, await other promises in a way that looks synchronous.*

*An async function is marked by the word async before the function keyword. Methods can also be made async by writing async before their name*

*Inside an async function, the word await can be put in front of an expression to wait for a promise to resolve and only then continue the execution of the function.*

*Asynchronous programming makes it possible to express waiting for long-running actions without freezing the program during these actions.*

*callbacks, functions that are called when the actions complete. An event loop schedules such callbacks to be called when appropriate, one after the other, so that their execution does not overlap.*

### ***PART II: BROWSER***

*(HTTP) is a protocol for retrieving named resources (chunks of information, such as web pages or pictures). It specifies that the side making the request should start with a line like this, naming the resource and the version of the protocol that it is trying to use: GET /index.html HTTP/1.1*

*To become part of the web, all you need to do is connect a machine to the internet and have it listen on port 80 with the HTTP protocol so that other computers can ask it for documents.*

*Each document on the web is named by a Uniform Resource Locator (URL),*

*The firstChild and lastChild properties point to the first and last child elements or have the value null for nodes without children.*

*“Get the first link in the document.” And we can. let link = document.body.getElementsByTagName("a")[0];console.log(link.href);*

*To find a specific single node, you can give it an id attribute and use document.getElementById instead.*

*A third, similar method is getElementsByClassName, which, like getElementsByTagName, searches through the contents of an element node and retrieves all elements that have the given string in their class attribute*

*There is a commonly used attribute, class, which is a keyword in the JavaScript language. For historical reasons—some old JavaScript implementations could not handle property names that matched keywords—the property used to access this attribute is called className.*

*The querySelectorAll method, which is defined both on the document object and on element nodes, takes a selector string and returns a NodeList containing all the elements that it matches.*

*window.addEventListener("click", () => {    console.log("You knocked?");  });*

*Event handlers make it possible to detect and react to events happening in our web page. The addEventListener method is used to register such a handler.*

*When the element’s method attribute is GET (or is omitted), the information in the form is added to the end of the action URL as a query string. The browser might make a request to this URL: GET /example/message.html?name=Jean&message=Yes%3F HTTP/1.1*

P*OST, the HTTP request made to submit the form will use the POST method and put the query string in the body of the request, rather than adding it to the URL. POST /example/message.html HTTP/1.1Content-length: 24Content-type: application/x-www-form-urlencodedname=Jean&message=Yes%3F*

HTTPS *It is not perfect, and there have been various incidents where HTTPS failed because of forged or stolen certificates and broken software, but it is a lot safer than plain HTTP.*

*All form fields can be disabled through their disabled attribute. It is an attribute that can be specified without value—the fact that it is present at all disables the element.*

*The localStorage object can be used to store data in a way that survives page reloads. This object allows you to file string values under names.*

*A value in localStorage sticks around until it is overwritten, it is removed with removeItem, or the user clears their local data. Sites from different domains get different storage compartments. That means data stored in localStorage by a given website can, in principle, be read (and overwritten) only by scripts on that same site.*

*A client sends a request, which contains a method (usually GET) and a path that identifies a resource. The server then decides what to do with the request and responds with a status code and a response body. Both requests and responses may contain headers that provide additional information.*

*When a form is submitted, a "submit" event is fired on it. A JavaScript handler can call preventDefault on that event to disable the browser’s default behavior. Form field elements may also occur outside of a form tag.*

*The localStorage and sessionStorage objects can be used to save information in a way that survives page reloads. The first object saves the data forever (or until the user decides to clear it), and the second saves it until the browser is closed.*

### *PART III: NODE*

*Node.js, a program that allows you to apply your JavaScript skills outside of the browser. With Node.js, you can build anything from small command line tools to HTTP servers that power dynamic websites.*

*Node was initially conceived for the purpose of making asynchronous programming easy and convenient*

*When require is called, Node has to resolve the given string to an actual file that it can load*

*NPM’s main use is downloading packages.*

*Node is a nice, small system that lets us run JavaScript in a nonbrowser context. It was originally designed for network tasks to play the role of a node in a network. But it lends itself to all kinds of scripting tasks, and if writing JavaScript is something you enjoy, automating tasks with Node works well. NPM provides packages for everything you can think of (and quite a few things you’d probably never think of), and it allows you to fetch and install those packages with the npm program. Node comes with a number of built-in modules*

### Optimization

*Avoiding Work The fastest way to do something is to avoid doing it—or at least part of it—at all. By thinking about what the code is doing, you can often spot unnecessary redundancy or things that can be done in a faster way.*

*The garbage collector wants to avoid looking through all the objects in the older generations every time the young generation is collected.*

*Thanks to the enormous amount of money being poured into the web, as well as the rivalry between the different browsers, JavaScript compilers are good at what they do: making code run fast. But sometimes you have to help them a little and rewrite your inner loops to avoid more expensive JavaScript features. Creating fewer objects (and arrays and strings) often helps. Before you start mangling your code to be faster, think about ways to make it do less work. The biggest opportunities for optimization are often found in that direction.*
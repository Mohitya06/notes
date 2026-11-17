# JavaScript - Level 1 (Fundamentals)

## 1. What are Variables and Variable Scoping?
**Answer:**
Variables store data values. JavaScript has three ways to declare: `var`, `let`, `const`.

```javascript
// var - function scoped, hoisted, can be redeclared
var x = 1;
var x = 2; // No error

// let - block scoped, not hoisted to global, can be reassigned
let y = 1;
let y = 2; // Error: Identifier 'y' already declared

// const - block scoped, not hoisted, cannot be reassigned
const z = 1;
z = 2; // Error: Assignment to constant variable
```

**Scopes:**
- **Global:** Accessible everywhere
- **Function:** Inside function only
- **Block:** Inside `{}` only (for let/const)

```javascript
function example() {
  if (true) {
    var a = 1; // Function scoped
    let b = 2; // Block scoped
    const c = 3; // Block scoped
  }
  console.log(a); // 1
  console.log(b); // ReferenceError
}
```

---

## 2. What are JavaScript Data Types?
**Answer:**
JavaScript has 8 data types:

**Primitive Types:**
```javascript
// 1. String
const str = "Hello";
const str2 = `Template literal: ${str}`;

// 2. Number
const num = 42;
const float = 3.14;
const special = Infinity;

// 3. Boolean
const bool = true;

// 4. Undefined - variable declared but not assigned
let undefined_var;

// 5. Null - intentional absence of value
const empty = null;

// 6. Symbol - unique identifier
const sym = Symbol('id');

// 7. BigInt - numbers larger than Number.MAX_SAFE_INTEGER
const big = 123456789012345678901234567890n;
```

**Reference Type:**
```javascript
// 8. Object (includes arrays, functions, objects)
const obj = { name: 'John' };
const arr = [1, 2, 3];
const func = () => {};
```

---

## 3. What is Type Coercion?
**Answer:**
Automatic conversion of one data type to another.

```javascript
// String coercion
console.log('5' + 2); // '52' (number coerced to string)
console.log('5' - 2); // 3 (string coerced to number)

// Number coercion
console.log(true + 1); // 2
console.log(false + 1); // 1

// Boolean coercion (truthy/falsy)
if ('hello') console.log('truthy'); // Prints
if ('') console.log('falsy'); // Doesn't print

// Falsy values: false, 0, '', null, undefined, NaN
// Truthy values: everything else
```

**Strict Equality (===) vs Loose Equality (==):**
```javascript
console.log(5 === '5'); // false (no coercion)
console.log(5 == '5'); // true (coerces string to number)
console.log(null == undefined); // true
console.log(null === undefined); // false
```

---

## 4. What are Functions?
**Answer:**
Functions are reusable blocks of code.

```javascript
// Function Declaration
function greet(name) {
  return `Hello, ${name}!`;
}

// Function Expression
const greet2 = function(name) {
  return `Hello, ${name}!`;
};

// Arrow Function (ES6+)
const greet3 = (name) => `Hello, ${name}!`;

// Calling functions
greet('John'); // 'Hello, John!'

// Default Parameters
function add(a = 0, b = 0) {
  return a + b;
}

// Rest Parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
sum(1, 2, 3); // 6

// Return statements
function process() {
  return 42; // Returns early
  console.log('Never executed');
}
```

---

## 5. What are Closures?
**Answer:**
A function that has access to variables from its outer scope even after the outer function has returned.

```javascript
function outer(x) {
  // Inner function has access to outer's x
  function inner() {
    console.log(x);
  }
  return inner;
}

const closure = outer(10);
closure(); // 10 (x is still accessible)

// Practical example - Counter
function createCounter() {
  let count = 0;
  
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.getCount(); // 2
```

---

## 6. What is the `this` Keyword?
**Answer:**
`this` refers to the object that owns the code being executed.

```javascript
// Global context
console.log(this); // window (browser) or global (Node.js)

// Object method
const obj = {
  name: 'John',
  greet: function() {
    console.log(this.name); // 'John'
  }
};
obj.greet();

// Arrow function inherits 'this' from parent
const person = {
  name: 'Alice',
  greet: function() {
    const arrow = () => {
      console.log(this.name); // 'Alice' (inherits from greet)
    };
    arrow();
  }
};

// Constructor function
function Person(name) {
  this.name = name; // Creates new object
}

const p = new Person('Bob');
console.log(p.name); // 'Bob'
```

---

## 7. What is Object-Oriented Programming in JavaScript?
**Answer:**
Using objects to structure and organize code.

```javascript
// Object Literal
const user = {
  name: 'John',
  age: 30,
  greet() {
    return `Hi, I'm ${this.name}`;
  }
};

// Constructor Function
function User(name, age) {
  this.name = name;
  this.age = age;
}

User.prototype.greet = function() {
  return `Hi, I'm ${this.name}`;
};

const user1 = new User('John', 30);

// ES6 Classes
class User2 {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  greet() {
    return `Hi, I'm ${this.name}`;
  }
}

const user2 = new User2('Alice', 25);
```

---

## 8. What are Prototypes and Prototype Inheritance?
**Answer:**
Every JavaScript object has a prototype. Objects inherit properties from their prototype.

```javascript
// Prototype chain
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function() {
  console.log(`${this.name} makes a sound`);
};

function Dog(name) {
  Animal.call(this, name);
}

// Set up inheritance
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name} barks`);
};

const dog = new Dog('Rex');
dog.speak(); // 'Rex makes a sound'
dog.bark(); // 'Rex barks'

// Check prototype
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
```

---

## 9. What is Hoisting?
**Answer:**
Moving declarations to the top of their scope before code execution.

```javascript
// Function hoisting - declarations are hoisted
console.log(add(2, 3)); // 5

function add(a, b) {
  return a + b;
}

// Variable hoisting
console.log(x); // undefined (hoisted but not initialized)
var x = 5;
console.log(x); // 5

// let and const are hoisted but not initialized (temporal dead zone)
console.log(y); // ReferenceError
let y = 10;

// Function expression not hoisted
console.log(subtract); // undefined (not hoisted as function)
var subtract = function(a, b) {
  return a - b;
};
```

---

## 10. What are Arrow Functions?
**Answer:**
Concise syntax for writing functions introduced in ES6.

```javascript
// Traditional function
function add(a, b) {
  return a + b;
}

// Arrow function
const add2 = (a, b) => {
  return a + b;
};

// Concise syntax (implicit return)
const add3 = (a, b) => a + b;

// Single parameter
const square = x => x * x;

// No parameters
const greet = () => 'Hello';

// Arrow functions don't have their own 'this'
const person = {
  name: 'John',
  age: 30,
  greet: function() {
    // 'this' works here
    const arrow = () => {
      // 'this' inherited from greet
      console.log(this.name);
    };
    arrow();
  }
};
```

---

## 11. What are Array Methods?
**Answer:**
Built-in functions to manipulate arrays.

```javascript
const arr = [1, 2, 3, 4, 5];

// map - transform each element
const doubled = arr.map(x => x * 2); // [2, 4, 6, 8, 10]

// filter - keep elements matching condition
const evens = arr.filter(x => x % 2 === 0); // [2, 4]

// reduce - combine all elements into single value
const sum = arr.reduce((acc, x) => acc + x, 0); // 15

// find - return first element matching condition
const firstEven = arr.find(x => x % 2 === 0); // 2

// includes - check if element exists
arr.includes(3); // true

// indexOf - find position
arr.indexOf(3); // 2

// slice - create shallow copy
arr.slice(1, 3); // [2, 3]

// splice - modify array in place
arr.splice(1, 2, 99); // [1, 99, 4, 5]

// forEach - iterate (no return)
arr.forEach(x => console.log(x));

// some - check if any element matches
arr.some(x => x > 4); // true

// every - check if all elements match
arr.every(x => x > 0); // true

// sort - sort in place
arr.sort((a, b) => a - b); // ascending
```

---

## 12. What is Object Destructuring?
**Answer:**
Extract properties from objects into variables.

```javascript
// Basic destructuring
const user = { name: 'John', age: 30, email: 'john@example.com' };
const { name, age } = user;
console.log(name); // 'John'

// Rename variables
const { name: userName, age: userAge } = user;

// Default values
const { role = 'user' } = user;
console.log(role); // 'user'

// Nested destructuring
const person = {
  name: 'Alice',
  address: {
    city: 'New York',
    zip: '10001'
  }
};
const { address: { city } } = person;
console.log(city); // 'New York'

// Function parameters
function displayUser({ name, age }) {
  console.log(`${name} is ${age}`);
}
displayUser(user); // 'John is 30'
```

---

## 13. What is Array Destructuring?
**Answer:**
Extract elements from arrays into variables.

```javascript
// Basic destructuring
const arr = [1, 2, 3, 4, 5];
const [first, second] = arr;
console.log(first, second); // 1, 2

// Skip elements
const [a, , c] = arr;
console.log(a, c); // 1, 3

// Rest elements
const [x, ...rest] = arr;
console.log(rest); // [2, 3, 4, 5]

// Default values
const [n1, n2, n3 = 0] = [10, 20];
console.log(n3); // 0

// Swapping
let p = 5, q = 10;
[p, q] = [q, p];
console.log(p, q); // 10, 5
```

---

## 14. What is Spread Operator?
**Answer:**
Spreads elements of iterable objects.

```javascript
// Array spreading
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2]; // [1, 2, 3, 4, 5, 6]

// Add elements
const withExtra = [0, ...arr1, 7]; // [0, 1, 2, 3, 7]

// Copy array
const copy = [...arr1]; // Shallow copy

// Object spreading
const obj1 = { a: 1, b: 2 };
const obj2 = { c: 3, d: 4 };
const merged = { ...obj1, ...obj2 }; // { a: 1, b: 2, c: 3, d: 4 }

// Override properties
const updated = { ...obj1, b: 99 }; // { a: 1, b: 99 }

// Function arguments
function sum(a, b, c) {
  return a + b + c;
}
const numbers = [1, 2, 3];
sum(...numbers); // 6
```

---

## 15. What is Template Literals?
**Answer:**
String interpolation using backticks.

```javascript
// Basic template literal
const name = 'John';
const greeting = `Hello, ${name}!`;

// Multi-line strings
const message = `
  This is a multi-line
  template literal
  without escape sequences
`;

// Expressions in templates
const a = 5, b = 10;
console.log(`${a} + ${b} = ${a + b}`); // '5 + 10 = 15'

// Tagged template literals
function highlight(strings, ...values) {
  return strings.map((str, i) => str + (values[i] || '')).join('**');
}

const result = highlight`Hello ${name}, you are ${25} years old`;
```

---

## 16. What are String Methods?
**Answer:**
Built-in functions for manipulating strings.

```javascript
const str = 'Hello World';

// Case conversion
str.toUpperCase(); // 'HELLO WORLD'
str.toLowerCase(); // 'hello world'

// Searching
str.includes('World'); // true
str.indexOf('o'); // 4
str.startsWith('Hello'); // true
str.endsWith('World'); // true

// Slicing and substrings
str.slice(0, 5); // 'Hello'
str.substring(0, 5); // 'Hello'
str.charAt(0); // 'H'

// Trimming
'  hello  '.trim(); // 'hello'
'  hello  '.trimStart(); // 'hello  '
'  hello  '.trimEnd(); // '  hello'

// Replacing
str.replace('World', 'JavaScript'); // 'Hello JavaScript'
str.replaceAll('l', 'L'); // 'HeLLo worLd'

// Splitting and repeating
str.split(' '); // ['Hello', 'World']
'ha'.repeat(3); // 'hahaha'

// Padding
'5'.padStart(3, '0'); // '005'
'5'.padEnd(3, '0'); // '500'
```

---

## 17. What is Object.keys(), Object.values(), Object.entries()?
**Answer:**
Methods to extract data from objects.

```javascript
const user = { name: 'John', age: 30, email: 'john@example.com' };

// Get keys
const keys = Object.keys(user);
console.log(keys); // ['name', 'age', 'email']

// Get values
const values = Object.values(user);
console.log(values); // ['John', 30, 'john@example.com']

// Get key-value pairs
const entries = Object.entries(user);
console.log(entries);
// [['name', 'John'], ['age', 30], ['email', 'john@example.com']]

// Iterate over entries
for (const [key, value] of entries) {
  console.log(`${key}: ${value}`);
}

// Create object from entries
const newUser = Object.fromEntries([
  ['name', 'Alice'],
  ['age', 25]
]);
console.log(newUser); // { name: 'Alice', age: 25 }
```

---

## 18. What is JSON?
**Answer:**
JavaScript Object Notation - text format for data exchange.

```javascript
// Object to JSON string
const user = { name: 'John', age: 30 };
const json = JSON.stringify(user);
console.log(json); // '{"name":"John","age":30}'

// JSON string to Object
const jsonStr = '{"name":"Alice","age":25}';
const obj = JSON.parse(jsonStr);
console.log(obj.name); // 'Alice'

// With replacer (stringify)
const filtered = JSON.stringify(user, ['name']);
console.log(filtered); // '{"name":"John"}'

// With space (pretty print)
const pretty = JSON.stringify(user, null, 2);
console.log(pretty);
// {
//   "name": "John",
//   "age": 30
// }

// Error handling
try {
  JSON.parse('invalid json');
} catch (e) {
  console.log('Invalid JSON');
}
```

---

## 19. What is Set and Map?
**Answer:**
ES6 collections for storing data.

**Set - Unique values**
```javascript
const set = new Set([1, 2, 2, 3, 3, 3]);
console.log(set); // Set { 1, 2, 3 }

set.add(4);
set.has(2); // true
set.delete(2);
set.size; // 3
set.clear();

// Iterate
for (const value of set) {
  console.log(value);
}
```

**Map - Key-value pairs**
```javascript
const map = new Map();

map.set('name', 'John');
map.set('age', 30);

map.get('name'); // 'John'
map.has('age'); // true
map.delete('name');
map.size; // 1

// Any value as key (including objects)
const obj = {};
map.set(obj, 'value for object');

// Iterate
for (const [key, value] of map) {
  console.log(key, value);
}
```

---

## 20. What is Equality Comparison?
**Answer:**
Different ways to compare values in JavaScript.

```javascript
// === Strict equality (no coercion)
5 === 5; // true
5 === '5'; // false
null === undefined; // false
NaN === NaN; // false

// == Loose equality (with coercion)
5 == '5'; // true
null == undefined; // true
false == 0; // true

// Object.is() - safer NaN and -0 comparison
Object.is(NaN, NaN); // true
Object.is(0, -0); // false
Object.is(5, 5); // true

// Deep equality for objects/arrays
function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

deepEqual({ a: 1 }, { a: 1 }); // true
deepEqual([1, 2], [1, 2]); // true

// Reference equality
const obj = { a: 1 };
const same = obj;
const copy = { a: 1 };

obj === same; // true (same reference)
obj === copy; // false (different reference)
```

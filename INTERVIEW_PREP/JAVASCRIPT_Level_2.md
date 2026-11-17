# JavaScript - Level 2 (Intermediate)

## 1. What are Promises?
**Answer:**
Promises represent eventual completion or failure of async operation.

```javascript
// Creating a promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Success!');
  }, 1000);
});

// Consuming a promise
promise
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Promise states: Pending → Fulfilled/Rejected
const successful = Promise.resolve('done');
const failed = Promise.reject('error');

// Promise methods
Promise.all([promise1, promise2]); // Wait for all
Promise.race([promise1, promise2]); // First to complete
Promise.allSettled([promise1, promise2]); // All results
Promise.any([promise1, promise2]); // First success

// Chaining promises
fetch('/api/user')
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(error => console.error(error))
  .finally(() => console.log('Complete'));
```

---

## 2. What is Async/Await?
**Answer:**
Modern way to handle asynchronous code, syntactic sugar over promises.

```javascript
// Async function returns a promise
async function fetchUser(id) {
  return { id, name: 'John' }; // Returns promise
}

// Await pauses execution until promise settles
async function getUser() {
  try {
    const response = await fetch('/api/user/1');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  } finally {
    console.log('Request completed');
  }
}

// Parallel execution
async function parallel() {
  const [user1, user2] = await Promise.all([
    fetch('/api/user/1').then(r => r.json()),
    fetch('/api/user/2').then(r => r.json())
  ]);
}

// Sequential execution
async function sequential() {
  const user1 = await fetch('/api/user/1').then(r => r.json());
  const user2 = await fetch('/api/user/2').then(r => r.json());
}

// Error propagation
async function example() {
  try {
    await riskyOperation();
  } catch (error) {
    throw new Error(`Failed: ${error.message}`);
  }
}
```

---

## 3. What is Event Delegation?
**Answer:**
Technique to listen to events on parent element instead of individual children.

```javascript
// Without delegation - add listener to each item
document.querySelectorAll('li').forEach(item => {
  item.addEventListener('click', () => {
    console.log('Item clicked');
  });
});

// With delegation - single listener on parent
const list = document.getElementById('list');
list.addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    console.log('Item clicked:', event.target.textContent);
  }
});

// Benefits:
// - Better performance for many elements
// - Works for dynamically added elements
// - Cleaner code

// Common pattern
document.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    handleButtonClick(event.target);
  } else if (event.target.matches('.link')) {
    handleLinkClick(event.target);
  }
});
```

---

## 4. What is Event Loop?
**Answer:**
Mechanism that executes code, collects and processes events.

```javascript
// Event Loop Order:
// 1. Execute synchronous code
// 2. Execute microtasks (promises, queueMicrotask)
// 3. Execute macrotasks (setTimeout, setInterval)
// 4. Repeat

console.log('Start');

setTimeout(() => {
  console.log('setTimeout'); // Macrotask
}, 0);

Promise.resolve()
  .then(() => {
    console.log('Promise'); // Microtask
  });

console.log('End');

// Output:
// Start
// End
// Promise
// setTimeout

// Why?
// 1. Sync code executes first
// 2. Microtasks (promises) execute before macrotasks
// 3. setTimeout is macrotask, executes last
```

---

## 5. What is Callback Hell and How to Avoid It?
**Answer:**
Deeply nested callbacks making code hard to read and maintain.

```javascript
// ❌ Callback Hell
function getUser(id, callback) {
  setTimeout(() => callback({ id, name: 'John' }), 1000);
}

function getPostsByUser(userId, callback) {
  setTimeout(() => callback([{ title: 'Post 1' }]), 1000);
}

// Nested callbacks - hard to read
getUser(1, (user) => {
  getPostsByUser(user.id, (posts) => {
    console.log(user, posts);
  });
});

// ✅ Solution 1: Named functions
function handleUser(user) {
  getPostsByUser(user.id, handlePosts);
}

function handlePosts(posts) {
  console.log(posts);
}

getUser(1, handleUser);

// ✅ Solution 2: Promises
getUser(1)
  .then(user => getPostsByUser(user.id))
  .then(posts => console.log(posts))
  .catch(error => console.error(error));

// ✅ Solution 3: Async/Await
async function getUserAndPosts() {
  try {
    const user = await getUser(1);
    const posts = await getPostsByUser(user.id);
    console.log(user, posts);
  } catch (error) {
    console.error(error);
  }
}
```

---

## 6. What is this Binding?
**Answer:**
Understanding how `this` is bound in different contexts.

```javascript
const obj = {
  name: 'Alice',
  greet: function() {
    console.log(this.name); // 'Alice'
  },
  greetArrow: () => {
    console.log(this.name); // undefined (inherits from outer scope)
  }
};

// Method call - this refers to object
obj.greet(); // 'Alice'
obj.greetArrow(); // undefined

// Function call - this refers to global object (or undefined in strict mode)
function greet() {
  console.log(this);
}
greet(); // Window/Global object

// Constructor call - this refers to new object
function Person(name) {
  this.name = name;
}
new Person('Bob'); // this = new object

// Explicit binding
const bind1 = obj.greet.bind(obj); // Permanently bind
obj.greet.call(obj); // Call with specific this
obj.greet.apply(obj, []); // Call with array args
```

---

## 7. What are call(), apply(), and bind()?
**Answer:**
Methods to control `this` in function invocation.

```javascript
const person = {
  name: 'John',
  age: 30
};

function introduce(greeting) {
  return `${greeting}, I'm ${this.name}`;
}

// call() - invoke immediately with specific this
const result1 = introduce.call(person, 'Hello');
console.log(result1); // 'Hello, I'm John'

// apply() - like call but accepts array of arguments
function greetMany(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const result2 = greetMany.apply(person, ['Hi', '!']);
console.log(result2); // 'Hi, I'm John!'

// bind() - returns new function with bound this
const boundIntroduce = introduce.bind(person);
const result3 = boundIntroduce('Hey');
console.log(result3); // 'Hey, I'm John'

// Partial application with bind
function add(a, b, c) {
  return a + b + c;
}

const add5 = add.bind(null, 5); // Partially apply first argument
add5(10, 15); // 30
```

---

## 8. What is Currying?
**Answer:**
Technique to transform function with multiple parameters into nested functions.

```javascript
// Regular function
function add(a, b, c) {
  return a + b + c;
}
add(1, 2, 3); // 6

// Curried version
function curriedAdd(a) {
  return function(b) {
    return function(c) {
      return a + b + c;
    };
  };
}

// Usage
curriedAdd(1)(2)(3); // 6

// Arrow function version
const curriedAdd2 = (a) => (b) => (c) => a + b + c;

// Partial application
const add1 = curriedAdd(1);
const add1And2 = add1(2);
const result = add1And2(3); // 6

// Generic curry function
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    } else {
      return function(...nextArgs) {
        return curried.apply(this, args.concat(nextArgs));
      };
    }
  };
}

const curriedAddGeneric = curry((a, b, c) => a + b + c);
console.log(curriedAddGeneric(1)(2)(3)); // 6
```

---

## 9. What is Object.assign() and Object.create()?
**Answer:**
Methods for object manipulation and inheritance.

**Object.assign():**
```javascript
// Copy properties from source to target
const target = { a: 1, b: 2 };
const source = { b: 3, c: 4 };

Object.assign(target, source);
console.log(target); // { a: 1, b: 3, c: 4 }

// Shallow copy
const original = { name: 'John', address: { city: 'NYC' } };
const copy = Object.assign({}, original);

// Note: address is still referenced
copy.address.city = 'LA';
console.log(original.address.city); // 'LA'

// Multiple sources
const merged = Object.assign({}, obj1, obj2, obj3);
```

**Object.create():**
```javascript
// Create object with specific prototype
const animal = {
  speak: function() {
    console.log('Animal sound');
  }
};

const dog = Object.create(animal);
dog.name = 'Rex';

dog.speak(); // 'Animal sound'
dog instanceof animal; // false (but inherits)

// Object.create(null) - create object with no prototype
const obj = Object.create(null);
obj.toString; // undefined (no inherited methods)

// With property descriptors
const obj2 = Object.create({}, {
  name: {
    value: 'John',
    writable: true
  }
});
```

---

## 10. What is WeakMap and WeakSet?
**Answer:**
Collections with weakly held references (can be garbage collected).

**WeakMap:**
```javascript
const weakMap = new WeakMap();

const obj1 = {};
const obj2 = {};

// Only objects as keys
weakMap.set(obj1, 'value1');
weakMap.set(obj2, 'value2');

weakMap.get(obj1); // 'value1'
weakMap.has(obj2); // true
weakMap.delete(obj1);

// No iteration (for privacy)
// No .size property
// Objects can be garbage collected
```

**WeakSet:**
```javascript
const weakSet = new WeakSet();

const obj = {};
weakSet.add(obj);
weakSet.has(obj); // true
weakSet.delete(obj);

// Use case: Track which objects have been processed
const processed = new WeakSet();

function process(obj) {
  if (processed.has(obj)) return;
  processed.add(obj);
  // Do something
}
```

---

## 11. What is Object Freezing and Sealing?
**Answer:**
Methods to restrict object modifications.

```javascript
// Object.freeze() - prevent all modifications
const frozen = { name: 'John', age: 30 };
Object.freeze(frozen);

frozen.name = 'Alice'; // Silent fail in non-strict mode
frozen.newProp = 'value'; // Silent fail
delete frozen.age; // Silent fail

console.log(frozen); // { name: 'John', age: 30 }

// Object.seal() - prevent adding/removing properties but allow modification
const sealed = { name: 'John', age: 30 };
Object.seal(sealed);

sealed.name = 'Alice'; // Allowed
sealed.newProp = 'value'; // Silent fail
delete sealed.age; // Silent fail

console.log(sealed); // { name: 'Alice', age: 30 }

// Object.preventExtensions() - prevent adding properties
const obj = { name: 'John' };
Object.preventExtensions(obj);

obj.name = 'Alice'; // Allowed
obj.age = 30; // Silent fail

// Check state
Object.isFrozen(frozen); // true
Object.isSealed(sealed); // true
Object.isExtensible(obj); // false
```

---

## 12. What are Proxies?
**Answer:**
Objects that intercept and customize operations.

```javascript
const target = {
  name: 'John',
  age: 30
};

const handler = {
  get(target, prop) {
    console.log(`Getting ${prop}`);
    return target[prop];
  },
  set(target, prop, value) {
    console.log(`Setting ${prop} to ${value}`);
    if (prop === 'age' && value < 0) {
      console.log('Age must be positive');
      return false;
    }
    target[prop] = value;
    return true;
  },
  deleteProperty(target, prop) {
    console.log(`Deleting ${prop}`);
    delete target[prop];
    return true;
  }
};

const proxy = new Proxy(target, handler);

proxy.name; // 'John', logs "Getting name"
proxy.age = 25; // logs "Setting age to 25"
proxy.age = -5; // logs "Age must be positive"
delete proxy.name; // logs "Deleting name"
```

---

## 13. What is Reflect API?
**Answer:**
Built-in object with methods to intercept operations similar to Proxies.

```javascript
const obj = { name: 'John', age: 30 };

// Get property
Reflect.get(obj, 'name'); // 'John'

// Set property
Reflect.set(obj, 'name', 'Alice'); // true

// Check property exists
Reflect.has(obj, 'age'); // true

// Get own property keys
Reflect.ownKeys(obj); // ['name', 'age']

// Delete property
Reflect.deleteProperty(obj, 'age'); // true

// Get property descriptor
Reflect.getOwnPropertyDescriptor(obj, 'name');

// Define property
Reflect.defineProperty(obj, 'role', {
  value: 'user',
  writable: true
});

// Used with Proxy
const proxy = new Proxy(obj, {
  get(target, prop) {
    console.log(`Accessing ${prop}`);
    return Reflect.get(target, prop);
  },
  set(target, prop, value) {
    console.log(`Setting ${prop}`);
    return Reflect.set(target, prop, value);
  }
});
```

---

## 14. What is Symbol?
**Answer:**
Unique and immutable data type used as object keys.

```javascript
// Create symbols
const sym1 = Symbol('id');
const sym2 = Symbol('id');

// Each symbol is unique
sym1 === sym2; // false

// Use as object key
const user = {
  [sym1]: '12345',
  name: 'John'
};

user[sym1]; // '12345'
user.name; // 'John'

// Symbols not enumerable
Object.keys(user); // ['name']
Object.getOwnPropertySymbols(user); // [sym1]

// Well-known symbols
// Symbol.iterator - for...of loop
const iterable = {
  [Symbol.iterator]() {
    let count = 0;
    return {
      next: () => ({
        value: count++,
        done: count > 3
      })
    };
  }
};

for (const val of iterable) {
  console.log(val); // 0, 1, 2
}

// Symbol.hasInstance - instanceof
// Symbol.toStringTag - Object.prototype.toString
// Symbol.toPrimitive - type coercion
```

---

## 15. What is Generators?
**Answer:**
Functions that can pause execution and resume later.

```javascript
// Generator function
function* generateNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generateNumbers();

gen.next(); // { value: 1, done: false }
gen.next(); // { value: 2, done: false }
gen.next(); // { value: 3, done: false }
gen.next(); // { value: undefined, done: true }

// Using in for...of loop
for (const num of generateNumbers()) {
  console.log(num); // 1, 2, 3
}

// Infinite generator
function* infiniteSequence() {
  let num = 0;
  while (true) {
    yield num++;
  }
}

// Generator delegation
function* combinedGenerator() {
  yield* generateNumbers(); // Delegates to another generator
  yield 4;
}

// Bidirectional communication
function* echo() {
  const value = yield 'Enter value';
  yield `You entered: ${value}`;
}

const e = echo();
e.next(); // { value: 'Enter value', done: false }
e.next(42); // { value: 'You entered: 42', done: false }
```

---

## 16. What is Destructuring Assignment (Advanced)?
**Answer:**
Complex destructuring patterns.

```javascript
// Nested destructuring
const person = {
  name: 'John',
  address: {
    street: '123 Main St',
    city: { name: 'NYC', zip: '10001' }
  }
};

const { address: { city: { name: cityName } } } = person;
console.log(cityName); // 'NYC'

// Rest in destructuring
const { name, ...rest } = person;
console.log(rest); // { address: {...} }

// Array with rest
const [first, second, ...remaining] = [1, 2, 3, 4, 5];
console.log(remaining); // [3, 4, 5]

// Default with complex objects
const { age = 30, role = 'user' } = person;

// Destructuring in parameters
function display({ name, age = 25 } = {}) {
  console.log(name, age);
}

// Swapping with destructuring
let a = 1, b = 2;
[a, b] = [b, a];

// Multiple assignment
const [x, y] = [1, 2];
const { p, q } = { p: 3, q: 4 };
```

---

## 17. What is Memoization?
**Answer:**
Caching function results to avoid recalculation.

```javascript
// Simple memoization
function memoize(fn) {
  const cache = {};
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (key in cache) {
      console.log('From cache');
      return cache[key];
    }
    
    console.log('Computing...');
    const result = fn.apply(this, args);
    cache[key] = result;
    return result;
  };
}

const fibonacci = memoize(function(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
});

fibonacci(10); // Computing...
fibonacci(10); // From cache

// Memoization with Map
function memoizeWithMap(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// LRU Memoization
function memoizeLRU(fn, limit = 10) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      // Move to end (most recently used)
      cache.delete(key);
      const value = cache.get(key);
      cache.set(key, value);
      return value;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    if (cache.size > limit) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  };
}
```

---

## 18. What is Function Composition?
**Answer:**
Combining multiple functions to create new function.

```javascript
// Basic composition
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const add = (x) => x + 1;
const multiply = (x) => x * 2;
const subtract = (x) => x - 3;

const composed = compose(subtract, multiply, add);
composed(5); // ((5 + 1) * 2) - 3 = 9

// Pipe (left-to-right) vs Compose (right-to-left)
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);

const piped = pipe(add, multiply, subtract);
piped(5); // (((5 + 1) * 2) - 3) = 9

// Practical example
const trim = (str) => str.trim();
const lowercase = (str) => str.toLowerCase();
const replace = (str) => str.replace(/\s+/g, '-');

const slugify = compose(replace, lowercase, trim);
slugify('  Hello World  '); // 'hello-world'
```

---

## 19. What is Functional Programming Paradigm?
**Answer:**
Programming style emphasizing functions and immutability.

```javascript
// Pure functions - no side effects
function add(a, b) {
  return a + b;
}

// Avoid mutations
const original = [1, 2, 3];

// ❌ Impure
function addElement(arr, val) {
  arr.push(val); // Mutates original
  return arr;
}

// ✅ Pure
function addElementPure(arr, val) {
  return [...arr, val]; // Returns new array
}

// Immutability
const user = { name: 'John', age: 30 };

// ❌ Impure
function updateAge(u, newAge) {
  u.age = newAge; // Mutates
  return u;
}

// ✅ Pure
function updateAgePure(u, newAge) {
  return { ...u, age: newAge }; // New object
}

// Higher-order functions
const map = (fn) => (arr) => arr.map(fn);
const filter = (predicate) => (arr) => arr.filter(predicate);

const double = (x) => x * 2;
const isEven = (x) => x % 2 === 0;

const data = [1, 2, 3, 4, 5];
const result = pipe(
  filter(isEven),
  map(double)
)(data); // [4, 8]
```

---

## 20. What is Regular Expressions?
**Answer:**
Pattern matching and text manipulation.

```javascript
// Creating regex
const regex1 = /pattern/flags; // Literal
const regex2 = new RegExp('pattern', 'flags'); // Constructor

// Common flags
// g - global (find all)
// i - case insensitive
// m - multiline
// s - dotAll

// Methods
const str = 'The quick brown fox';

// test() - returns boolean
/quick/.test(str); // true

// exec() - returns match details
/quick/.exec(str); // [ 'quick', ... ]

// String methods
str.match(/o/g); // ['o', 'o']
str.search(/brown/); // 10
str.replace(/fox/, 'dog'); // 'The quick brown dog'
str.split(/\s+/); // ['The', 'quick', 'brown', 'fox']

// Common patterns
/\d+/; // Numbers
/[a-z]/i; // Letters
/\w+/; // Word characters
/^\w+/; // Start with word chars
/\w+$/; // End with word chars
/.+@.+\..+/; // Email pattern

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Password validation
function isStrongPassword(pwd) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
}
```

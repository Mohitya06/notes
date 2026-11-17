# JavaScript - Level 3 (Advanced)

## 1. What is Event Bubbling, Capturing, and Delegation?
**Answer:**
Understanding event propagation in the DOM.

```javascript
// Event capturing and bubbling phases
// Capturing: Document → Target
// Bubbling: Target → Document

// HTML structure
// <div id="parent">
//   <button id="child">Click me</button>
// </div>

const parent = document.getElementById('parent');
const child = document.getElementById('child');

// Capturing phase (useCapture = true)
parent.addEventListener('click', () => {
  console.log('Parent capturing');
}, true); // useCapture

// Bubbling phase (useCapture = false)
child.addEventListener('click', () => {
  console.log('Child bubbling');
});

parent.addEventListener('click', () => {
  console.log('Parent bubbling');
}, false);

// When child is clicked:
// 1. Parent capturing (capturing phase)
// 2. Child bubbling (target phase)
// 3. Parent bubbling (bubbling phase)

// Stop propagation
document.addEventListener('click', (event) => {
  if (event.target.matches('.button')) {
    event.stopPropagation(); // Stops bubbling
    event.stopImmediatePropagation(); // Stops all handlers
    event.preventDefault(); // Prevents default action
  }
});

// Event delegation for dynamic elements
document.addEventListener('click', (event) => {
  if (event.target.matches('button.delete')) {
    deleteItem(event.target.dataset.id);
  }
});
```

---

## 2. What is Memory Management and Garbage Collection?
**Answer:**
How JavaScript manages memory and prevents leaks.

```javascript
// Memory lifecycle:
// 1. Allocate memory
// 2. Use memory
// 3. Release memory when not needed

// Common memory leaks:

// 1. Global variables
globalVariable = 'This leaks!'; // Creates global reference

// 2. Forgotten timers
setInterval(() => {
  // This never stops, holds references
}, 1000);

// 3. DOM references
const button = document.querySelector('button');
document.body.removeChild(button);
// button still referenced in memory

// 4. Circular references
const obj1 = { ref: null };
const obj2 = { ref: null };
obj1.ref = obj2;
obj2.ref = obj1; // Circular reference

// Prevention strategies:
// - Clear timers/intervals
clearInterval(timerId);
clearTimeout(timeoutId);

// - Remove event listeners
element.removeEventListener('click', handler);

// - Delete references
delete obj.reference;

// - Nullify variables
myArray = null;

// - Use WeakMap for object references
const objectMetadata = new WeakMap();
objectMetadata.set(largeObject, metadata);
// largeObject can be garbage collected

// Garbage collection algorithms:
// - Mark and sweep: Mark reachable objects, sweep unreachable
// - Reference counting: Count references to objects (not used in modern JS)
// - Generational: Separate young and old objects
```

---

## 3. What is Virtual DOM (Conceptually)?
**Answer:**
In-memory representation of actual DOM.

```javascript
// Simplified Virtual DOM concept
class VirtualDOM {
  constructor(type, props, children) {
    this.type = type;
    this.props = props;
    this.children = children;
  }
}

// Create virtual representation
const virtualTree = new VirtualDOM('div', 
  { className: 'container', id: 'app' },
  [
    new VirtualDOM('h1', {}, ['Hello']),
    new VirtualDOM('p', {}, ['World'])
  ]
);

// Render to real DOM
function render(vnode, container) {
  const element = document.createElement(vnode.type);
  
  // Set attributes
  if (vnode.props) {
    Object.entries(vnode.props).forEach(([key, value]) => {
      if (key.startsWith('on')) {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
  }
  
  // Add children
  if (vnode.children) {
    vnode.children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(render(child, element));
      }
    });
  }
  
  container.appendChild(element);
  return element;
}

// Reconciliation (diffing)
function diff(oldVnode, newVnode) {
  if (!oldVnode) return { type: 'CREATE', node: newVnode };
  if (!newVnode) return { type: 'REMOVE' };
  
  if (oldVnode.type !== newVnode.type) {
    return { type: 'REPLACE', node: newVnode };
  }
  
  return { type: 'UPDATE', props: diffProps(oldVnode.props, newVnode.props) };
}
```

---

## 4. What is this in Arrow Functions vs Regular Functions?
**Answer:**
Critical difference in `this` binding.

```javascript
// Regular function - 'this' is dynamic
function RegularFunc() {
  console.log(this);
}

// Arrow function - 'this' is lexical (from parent scope)
const ArrowFunc = () => {
  console.log(this);
};

// Example 1: Object method
const obj = {
  name: 'John',
  regularMethod: function() {
    console.log(this.name); // 'John' - refers to obj
  },
  arrowMethod: () => {
    console.log(this.name); // undefined - refers to window/global
  },
  delayedRegular: function() {
    setTimeout(function() {
      console.log(this.name); // undefined - this is window
    }, 1000);
  },
  delayedArrow: function() {
    setTimeout(() => {
      console.log(this.name); // 'John' - inherits from method
    }, 1000);
  }
};

obj.regularMethod(); // 'John'
obj.arrowMethod(); // undefined
obj.delayedRegular(); // undefined
obj.delayedArrow(); // 'John'

// Example 2: Constructor
function PersonRegular(name) {
  this.name = name; // 'this' is new instance
}

const PersonArrow = (name) => {
  this.name = name; // 'this' is window/global - ERROR!
};

new PersonRegular('John'); // Works
new PersonArrow('Alice'); // TypeError
```

---

## 5. What is Scope Chain?
**Answer:**
How JavaScript finds variables in nested scopes.

```javascript
// Global scope
var globalVar = 'global';

function outer() {
  // Outer function scope
  var outerVar = 'outer';
  
  function middle() {
    // Middle function scope
    var middleVar = 'middle';
    
    function inner() {
      // Inner function scope
      var innerVar = 'inner';
      
      // Can access all variables through scope chain
      console.log(innerVar); // 'inner' - local
      console.log(middleVar); // 'middle' - outer
      console.log(outerVar); // 'outer' - outer
      console.log(globalVar); // 'global' - global
    }
    
    inner();
  }
  
  middle();
}

outer();

// Scope chain resolution:
// Inner scope → Middle scope → Outer scope → Global scope

// Shadowing
var x = 'global';

function test() {
  var x = 'local'; // Shadows global x
  console.log(x); // 'local'
}

test();
console.log(x); // 'global'
```

---

## 6. What is Temporal Dead Zone (TDZ)?
**Answer:**
Period where let/const are hoisted but not initialized.

```javascript
// Variable hoisting difference

// var - initialized with undefined
console.log(x); // undefined (no error)
var x = 5;

// let/const - not initialized (Temporal Dead Zone)
console.log(y); // ReferenceError: Cannot access 'y' before initialization
let y = 10;

// TDZ explained
function example() {
  console.log(z); // In TDZ, ReferenceError
  
  let z = 20; // Initialization ends TDZ
  
  console.log(z); // 20
}

// TDZ applies to parameters too
function test(a = b, b = 1) {
  // b is in TDZ when default value a = b is evaluated
}
test(undefined, 2); // ReferenceError

// for loop with let
for (let i = 0; i < 3; i++) {
  // i is created new for each iteration
  // This creates a new binding for each iteration (block scope)
}

// Accessing before declaration in same scope
try {
  typeof x; // ReferenceError (not just typeof trick)
  let x;
} catch (e) {
  console.log(e.message);
}
```

---

## 7. What is Object-Oriented vs Functional Programming?
**Answer:**
Two different programming paradigms.

**Object-Oriented:**
```javascript
// State + Behavior combined in objects
class BankAccount {
  constructor(balance) {
    this.balance = balance;
  }
  
  deposit(amount) {
    this.balance += amount;
  }
  
  withdraw(amount) {
    this.balance -= amount;
  }
  
  getBalance() {
    return this.balance;
  }
}

const account = new BankAccount(1000);
account.deposit(100);
```

**Functional:**
```javascript
// Data and functions separated
const initialBalance = 1000;

const deposit = (balance, amount) => balance + amount;
const withdraw = (balance, amount) => balance - amount;
const getBalance = (balance) => balance;

let balance = initialBalance;
balance = deposit(balance, 100);
```

**Comparison:**
```javascript
// OOP: mutable state, encapsulation, inheritance
// Functional: immutable state, pure functions, composition

// OOP: "How" things are done
// Functional: "What" needs to be done

// Real-world comparison
// OOP: Create class, modify state directly
const user = new User('John');
user.updateAge(31); // Modifies user

// Functional: Create immutable data, return new state
const user = { name: 'John', age: 30 };
const updatedUser = { ...user, age: 31 }; // New object
```

---

## 8. What is Tail Call Optimization (TCO)?
**Answer:**
Optimization that prevents stack overflow in recursive functions.

```javascript
// Fibonacci without TCO - stack grows
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2); // Multiple calls
}

// Fibonacci with TCO - constant stack space (in strict mode)
function fibTCO(n, a = 0, b = 1) {
  if (n === 0) return a;
  return fibTCO(n - 1, b, a + b); // Single tail call
}

// TCO requires:
// 1. Strict mode
// 2. Single recursive call at end
// 3. No operations after return

'use strict';

function factorial(n, acc = 1) {
  if (n <= 1) return acc;
  return factorial(n - 1, n * acc); // Tail position
}

factorial(5); // Returns without stack overflow

// Not tail call optimized
function notTCO(n) {
  if (n <= 1) return 1;
  return n * notTCO(n - 1); // Needs to multiply after return
}
```

---

## 9. What are Static Properties and Methods?
**Answer:**
Properties and methods that belong to the class, not instances.

```javascript
// Static methods
class Math2 {
  static PI = 3.14159;
  
  static add(a, b) {
    return a + b;
  }
  
  static multiply(a, b) {
    return a * b;
  }
  
  constructor(value) {
    this.value = value;
  }
  
  instance Method() {
    return this.value * 2;
  }
}

// Access static members
Math2.add(2, 3); // 5
Math2.PI; // 3.14159

const math = new Math2(10);
math.add(2, 3); // TypeError - not instance method

// Static with inheritance
class Animal {
  static species = 'Unknown';
  
  static describe() {
    return `This is ${this.species}`;
  }
}

class Dog extends Animal {
  static species = 'Canis familiaris';
}

Dog.describe(); // 'This is Canis familiaris'

// Private static
class Counter {
  static #count = 0;
  
  static increment() {
    Counter.#count++;
  }
  
  static getCount() {
    return Counter.#count;
  }
}
```

---

## 10. What are Private Fields in Classes?
**Answer:**
True private properties in classes.

```javascript
// Private fields (ES2022)
class Person {
  #ssn; // Private field
  #password; // Private field
  
  constructor(name, ssn, password) {
    this.name = name; // Public
    this.#ssn = ssn; // Private
    this.#password = password; // Private
  }
  
  // Private method
  #validatePassword() {
    return this.#password.length > 8;
  }
  
  // Public method accessing private
  getValidationStatus() {
    return this.#validatePassword();
  }
  
  // Getter
  get ssn() {
    return this.#ssn.slice(-4).padStart(9, '*');
  }
}

const person = new Person('John', '123456789', 'SecurePass123');
console.log(person.name); // 'John'
console.log(person.ssn); // '*****6789'
console.log(person.#ssn); // SyntaxError - cannot access
person.#validatePassword(); // SyntaxError - cannot access

// Private static
class Database {
  static #connections = new Map();
  
  static #getConnection(id) {
    return Database.#connections.get(id);
  }
  
  static addConnection(id, conn) {
    Database.#connections.set(id, conn);
  }
}
```

---

## 11. What is Conditional Property Access and Optional Chaining?
**Answer:**
Safe navigation of nested properties.

```javascript
// Optional chaining (?.)
const user = {
  name: 'John',
  address: {
    street: '123 Main St',
    city: {
      name: 'NYC',
      zip: '10001'
    }
  }
};

// Without optional chaining - can throw error
user.address.city.name; // 'NYC'
user.work.company.name; // TypeError

// With optional chaining
user.address?.city?.name; // 'NYC'
user.work?.company?.name; // undefined (no error)

// Optional chaining with methods
const obj = {
  method: () => 'result'
};

obj.method?.(); // 'result'
obj.nonExistent?.(); // undefined (no error)

// Optional chaining with arrays
const arr = [1, 2, 3];
arr?.[0]; // 1
arr?.[5]; // undefined

// Nullish coalescing (??)
const value = null;
const result = value ?? 'default'; // 'default'

// Different from || (which also treats 0, '', false as falsy)
const zero = 0;
zero || 10; // 10
zero ?? 10; // 0

// Combining optional chaining and nullish coalescing
const city = user?.address?.city?.name ?? 'Unknown';
```

---

## 12. What is Destructuring in Loops?
**Answer:**
Using destructuring in for...of and forEach loops.

```javascript
// Array destructuring in loops
const users = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Alice', age: 25 },
  { id: 3, name: 'Bob', age: 35 }
];

// Destructure in forEach
users.forEach(({ id, name, age }) => {
  console.log(`${id}: ${name} is ${age}`);
});

// Destructure in for...of
for (const { name, age } of users) {
  console.log(`${name} is ${age}`);
}

// Nested destructuring in loops
const data = [
  { user: { name: 'John', email: 'john@example.com' } },
  { user: { name: 'Alice', email: 'alice@example.com' } }
];

for (const { user: { name, email } } of data) {
  console.log(`${name}: ${email}`);
}

// Map iteration
const map = new Map([
  ['name', 'John'],
  ['age', 30],
  ['city', 'NYC']
]);

for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
}

// Object entries iteration with destructuring
const obj = { name: 'John', age: 30, city: 'NYC' };

for (const [key, value] of Object.entries(obj)) {
  console.log(`${key}: ${value}`);
}
```

---

## 13. What is Tree Shaking?
**Answer:**
Eliminating dead code in modules.

```javascript
// Named exports - can be tree-shaken
// math.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;
export const multiply = (a, b) => a * b;

// main.js - tree shaker removes unused subtract
import { add, multiply } from './math.js';

console.log(add(2, 3));
console.log(multiply(2, 3));
// subtract is not included in bundle

// Default exports - cannot be tree-shaken
// helper.js
export default {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b
};

// main.js - entire object included
import helper from './helper.js';

console.log(helper.add(2, 3));
// All methods included (cannot remove subtract)

// Side effects prevent tree-shaking
// config.js - has side effect
console.log('Initializing config'); // Side effect
export const timeout = 5000;

// main.js
import { timeout } from './config.js';
// config.js is included even if timeout unused
// because of side effect

// Mark as side-effect free in package.json
{
  "sideEffects": false // All modules are side-effect free
}
```

---

## 14. What is Polyfilling?
**Answer:**
Providing fallback implementations for missing features.

```javascript
// Polyfill for Array.prototype.includes (IE doesn't have it)
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      const n = parseInt(fromIndex) || 0;
      
      let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
      
      while (k < len) {
        if (O[k] === searchElement) return true;
        k++;
      }
      
      return false;
    }
  });
}

// Polyfill for Object.assign
if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    value: function assign(target, ...sources) {
      if (target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      
      const to = Object(target);
      
      sources.forEach(source => {
        if (source !== null) {
          for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
              to[key] = source[key];
            }
          }
        }
      });
      
      return to;
    }
  });
}

// Polyfill for Promise (if not available)
if (typeof Promise === 'undefined') {
  // Implement Promise class
}
```

---

## 15. What is Lazy Evaluation?
**Answer:**
Delaying computation until results are needed.

```javascript
// Eager evaluation - computes immediately
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2); // [2, 4, 6, 8, 10]

// Only when needed
console.log(doubled[0]); // 2

// Lazy evaluation - compute only what's needed
function* lazyMap(fn, iterable) {
  for (const item of iterable) {
    yield fn(item); // Computed only when accessed
  }
}

const lazyDoubled = lazyMap(x => {
  console.log(`Computing ${x} * 2`);
  return x * 2;
}, numbers);

console.log(lazyDoubled.next().value); // Logs "Computing 1 * 2", returns 2

// Practical example - infinite sequences
function* infiniteSequence(start = 0) {
  let num = start;
  while (true) {
    yield num++;
  }
}

// Only generates values as needed
const seq = infiniteSequence();
seq.next().value; // 0
seq.next().value; // 1
seq.next().value; // 2

// Take first n items
function take(n, iterable) {
  const result = [];
  for (const item of iterable) {
    if (result.length === n) break;
    result.push(item);
  }
  return result;
}

take(5, infiniteSequence()); // [0, 1, 2, 3, 4]
```

---

## 16. What is Sandbox Execution?
**Answer:**
Running code in isolated environment with limited access.

```javascript
// Using Web Workers for sandboxing (runs in separate thread)
// worker.js
self.addEventListener('message', (event) => {
  const result = expensiveComputation(event.data);
  self.postMessage(result);
});

// main.js
const worker = new Worker('worker.js');
worker.postMessage(largeData);
worker.addEventListener('message', (event) => {
  console.log('Result:', event.data);
});

// Using iframe for sandboxing
// sandbox.html
<iframe sandbox="allow-scripts"></iframe>

// Using Function constructor (limited sandbox)
const code = 'return 2 + 2';
const fn = new Function(code);
fn(); // 4

// Using eval (NOT recommended - security risk)
eval('2 + 2'); // 4

// Safer alternative - JSON parsing for data
const userCode = '{"name": "John", "age": 30}';
const data = JSON.parse(userCode);
// Only processes JSON, not executable code
```

---

## 17. What is Atomicity and Determinism?
**Answer:**
Properties for reliable and predictable code.

```javascript
// Atomicity - operation completes fully or not at all
class BankTransfer {
  transfer(fromAccount, toAccount, amount) {
    // Start transaction
    try {
      fromAccount.withdraw(amount); // Must complete
      toAccount.deposit(amount); // Must complete
      // Both succeed or both fail
      return true;
    } catch (error) {
      // Rollback if error
      fromAccount.deposit(amount);
      toAccount.withdraw(amount);
      throw error;
    }
  }
}

// Determinism - same input always produces same output
// Deterministic function
function add(a, b) {
  return a + b;
}

add(2, 3); // Always 5
add(2, 3); // Always 5

// Non-deterministic function
function random() {
  return Math.random();
}

random(); // Different each time
random(); // Different each time

// Pure functions are deterministic
function multiply(a, b) {
  return a * b; // No side effects, predictable
}

// Impure functions are non-deterministic
let multiplier = 2;
function multiplyWithState(a) {
  return a * multiplier; // Depends on external state
}
```

---

## 18. What is Object Immutability?
**Answer:**
Preventing modifications to objects.

```javascript
// Object.freeze - prevent all modifications
const frozen = { name: 'John', age: 30 };
Object.freeze(frozen);

frozen.age = 40; // Silently fails
frozen.newProp = 'value'; // Fails
delete frozen.name; // Fails

// Deep freeze for nested objects
function deepFreeze(obj) {
  Object.freeze(obj);
  Object.values(obj).forEach(value => {
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value);
    }
  });
  return obj;
}

const deeply = { user: { name: 'John', address: { city: 'NYC' } } };
deepFreeze(deeply);
deeply.user.address.city = 'LA'; // Fails

// Immutable patterns
// 1. Spread operator
const updated = { ...obj, name: 'Alice' };

// 2. Array methods that return new array
const arr = [1, 2, 3];
const added = [...arr, 4]; // New array
const mapped = arr.map(x => x * 2); // New array

// 3. Using Object.assign
const newObj = Object.assign({}, obj, { age: 31 });

// 4. Libraries for immutability
// Immer - allows "mutations" on draft, returns new object
import { produce } from 'immer';

const newState = produce(state, draft => {
  draft.user.name = 'Alice';
  draft.user.age = 31;
});
```

---

## 19. What is Serialization and Deserialization?
**Answer:**
Converting objects to and from transmittable format.

```javascript
// JSON serialization/deserialization
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  createdAt: new Date()
};

// Serialization
const json = JSON.stringify(user);
// {"id":1,"name":"John","email":"john@example.com","createdAt":"2024-01-01T..."}

// Custom serialization with replacer
const customJson = JSON.stringify(user, (key, value) => {
  if (key === 'email') return undefined; // Exclude email
  if (value instanceof Date) return value.toISOString();
  return value;
});

// Deserialization
const parsed = JSON.parse(json);

// Custom deserialization with reviver
const revived = JSON.parse(json, (key, value) => {
  if (key === 'createdAt') return new Date(value);
  return value;
});

// Serialization edge cases
const circular = { a: 1 };
circular.self = circular;

JSON.stringify(circular); // TypeError - circular reference

// Serialization with toJSON method
const custom = {
  name: 'John',
  secret: 'password123',
  toJSON() {
    return {
      name: this.name
      // secret excluded
    };
  }
};

JSON.stringify(custom); // {"name":"John"}
```

---

## 20. What is Context API and State Management Comparison?
**Answer:**
Different approaches to managing application state.

```javascript
// 1. Prop Drilling (passing through multiple levels)
// Not shown - antipattern

// 2. Context API (React example, conceptually)
class ThemeProvider {
  constructor() {
    this.theme = 'light';
    this.subscribers = [];
  }
  
  subscribe(callback) {
    this.subscribers.push(callback);
  }
  
  setTheme(theme) {
    this.theme = theme;
    this.subscribers.forEach(cb => cb(theme));
  }
  
  getTheme() {
    return this.theme;
  }
}

// 3. Observer Pattern (pub/sub)
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
  }
  
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }
}

// 4. Redux-like state management
class Store {
  constructor(reducer, initialState) {
    this.state = initialState;
    this.reducer = reducer;
    this.subscribers = [];
  }
  
  dispatch(action) {
    this.state = this.reducer(this.state, action);
    this.notify();
  }
  
  subscribe(listener) {
    this.subscribers.push(listener);
  }
  
  notify() {
    this.subscribers.forEach(listener => listener(this.state));
  }
  
  getState() {
    return this.state;
  }
}

// Usage
const store = new Store(
  (state, action) => {
    switch(action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      default:
        return state;
    }
  },
  { count: 0 }
);

store.subscribe(state => console.log('State:', state));
store.dispatch({ type: 'INCREMENT' });
```

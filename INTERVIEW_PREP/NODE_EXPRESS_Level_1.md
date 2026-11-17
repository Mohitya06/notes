# Node.js & Express - Level 1 (Fundamentals)

## 1. What is Node.js?
**Answer:**
Node.js is a JavaScript runtime environment that allows running JavaScript outside the browser, built on Chrome's V8 engine. It's single-threaded, event-driven, and non-blocking I/O.

**Characteristics:**
- Asynchronous and event-driven
- Non-blocking I/O
- Runs JavaScript on server
- Great for I/O intensive applications
- Not ideal for CPU intensive tasks

---

## 2. What is the Event Loop in Node.js?
**Answer:**
The event loop continuously checks for tasks and executes them.

**Phases (in order):**
1. **Timers:** Execute setTimeout/setInterval callbacks
2. **Pending callbacks:** Execute I/O callbacks
3. **Idle, Prepare:** Internal operations
4. **Poll:** Retrieve new I/O events
5. **Check:** Execute setImmediate callbacks
6. **Close callbacks:** Execute close callbacks

```javascript
console.log('Start');

setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
Promise.resolve().then(() => console.log('Promise'));

console.log('End');

// Output:
// Start
// End
// Promise (Microtask)
// setTimeout (Timers phase)
// setImmediate (Check phase)
```

---

## 3. What is the difference between setTimeout, setImmediate, and process.nextTick?
**Answer:**

| Method | When | Use Case |
|--------|------|----------|
| setTimeout | After minimum delay (4ms) | Async delays |
| setImmediate | Next iteration of event loop | Batch operations |
| process.nextTick | Before any I/O event | Error handling |

```javascript
setImmediate(() => console.log('setImmediate'));
setTimeout(() => console.log('setTimeout'), 0);
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('Promise'));

// Output:
// nextTick (highest priority)
// Promise (microtask)
// setTimeout (timers phase)
// setImmediate (check phase)
```

---

## 4. What is Express.js?
**Answer:**
Express is a minimal and flexible Node.js web framework for building:
- Web applications
- APIs
- Microservices

Features:
- Routing
- Middleware support
- Request/response handling
- Static file serving
- Template engines

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

## 5. What are Middleware in Express?
**Answer:**
Middleware functions have access to request/response objects and can modify them or pass to next middleware.

```javascript
// Custom middleware
const logMiddleware = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass to next middleware
};

app.use(logMiddleware);

// Built-in middleware
app.use(express.json()); // Parse JSON
app.use(express.static('public')); // Serve static files

// Route-specific middleware
app.get('/admin', authMiddleware, (req, res) => {
  res.send('Admin page');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).send('Error');
});
```

---

## 6. What is Callback Hell and how to avoid it?
**Answer:**
Callback hell is deeply nested callbacks making code hard to read.

**Problem:**
```javascript
fs.readFile('file.txt', (err, data) => {
  if (err) console.error(err);
  else {
    db.query('SELECT * FROM users', (err, results) => {
      if (err) console.error(err);
      else {
        api.call('endpoint', (err, response) => {
          if (err) console.error(err);
          else {
            console.log(response);
          }
        });
      }
    });
  }
});
```

**Solutions:**

1. **Named functions:**
```javascript
function readFile() {
  fs.readFile('file.txt', handleReadFile);
}

function handleReadFile(err, data) {
  if (err) return console.error(err);
  db.query('SELECT * FROM users', handleQuery);
}

function handleQuery(err, results) {
  if (err) return console.error(err);
  console.log(results);
}
```

2. **Promises:**
```javascript
fs.promises.readFile('file.txt')
  .then(data => db.query('SELECT * FROM users'))
  .then(results => api.call('endpoint'))
  .then(response => console.log(response))
  .catch(err => console.error(err));
```

3. **Async/Await:**
```javascript
async function main() {
  try {
    const data = await fs.promises.readFile('file.txt');
    const results = await db.query('SELECT * FROM users');
    const response = await api.call('endpoint');
    console.log(response);
  } catch (err) {
    console.error(err);
  }
}
```

---

## 7. What are Promises?
**Answer:**
Promise represents eventual completion (or failure) of async operation.

**States:**
- **Pending:** Initial state
- **Fulfilled:** Operation completed successfully
- **Rejected:** Operation failed

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Success');
  }, 1000);
});

promise
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Static methods
Promise.all([promise1, promise2]); // All must resolve
Promise.race([promise1, promise2]); // First to settle
Promise.allSettled([promise1, promise2]); // Wait for all
```

---

## 8. What is Async/Await?
**Answer:**
Async/await is syntactic sugar over promises, making async code look synchronous.

```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Usage
const data = await fetchData('/api/data');
```

**Key points:**
- async function always returns a promise
- await pauses execution until promise settles
- Error handling with try/catch
- Cleaner than .then() chains

---

## 9. What are RESTful APIs?
**Answer:**
REST (Representational State Transfer) uses HTTP methods on resources.

**HTTP Methods:**
- **GET:** Retrieve resource
- **POST:** Create resource
- **PUT:** Update entire resource
- **PATCH:** Update partial resource
- **DELETE:** Delete resource

```javascript
// RESTful API example
app.get('/users', (req, res) => {
  // Get all users
  res.json(users);
});

app.post('/users', (req, res) => {
  // Create user
  const newUser = req.body;
  users.push(newUser);
  res.status(201).json(newUser);
});

app.put('/users/:id', (req, res) => {
  // Update user
  const user = users.find(u => u.id === req.params.id);
  Object.assign(user, req.body);
  res.json(user);
});

app.delete('/users/:id', (req, res) => {
  // Delete user
  users = users.filter(u => u.id !== req.params.id);
  res.status(204).send();
});
```

**Status Codes:**
- 200: OK
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Server Error

---

## 10. What is GraphQL vs REST?
**Answer:**

| Feature | REST | GraphQL |
|---------|------|---------|
| Query | Multiple endpoints | Single endpoint |
| Over-fetching | Common | No |
| Under-fetching | Requires multiple calls | Single call |
| Learning curve | Easy | Steep |
| Caching | Easy (HTTP) | Complex |

**GraphQL Example:**
```graphql
query GetUser {
  user(id: 1) {
    id
    name
    posts {
      title
    }
  }
}
```

Single request gets user with specific fields and related posts.

---

## 11. What are Streams in Node.js?
**Answer:**
Streams handle data flowing from source to destination in chunks.

**Types:**
- **Readable:** Consume data
- **Writable:** Write data
- **Duplex:** Both read and write
- **Transform:** Modify data during transfer

```javascript
const fs = require('fs');

// Reading large file efficiently
const readStream = fs.createReadStream('large-file.txt');

readStream.on('data', chunk => {
  console.log('Chunk:', chunk.length);
});

readStream.on('end', () => {
  console.log('Done');
});

// Piping
fs.createReadStream('source.txt')
  .pipe(fs.createWriteStream('destination.txt'));

// Transform stream
const { Transform } = require('stream');

const toUpperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

fs.createReadStream('input.txt')
  .pipe(toUpperCase)
  .pipe(fs.createWriteStream('output.txt'));
```

---

## 12. What is Buffer in Node.js?
**Answer:**
Buffer handles binary data in Node.js.

```javascript
// Create buffer
const buf = Buffer.alloc(10); // Allocate 10 bytes
const buf2 = Buffer.from('Hello'); // From string
const buf3 = Buffer.from([1, 2, 3]); // From array

// Read/Write
console.log(buf2[0]); // 72 (ASCII value of 'H')
buf2[0] = 74; // Change to 'J'

// Concatenate
const combined = Buffer.concat([buf2, buf3]);

// Encoding
const str = buf2.toString(); // 'Hello'
const hex = buf2.toString('hex'); // '48656c6c6f'
const base64 = buf2.toString('base64'); // 'SGVsbG8='
```

---

## 13. What is Clustering in Node.js?
**Answer:**
Clustering allows using multiple CPU cores to handle requests.

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Worker process
  const app = express();
  
  app.get('/', (req, res) => {
    res.send(`Handled by worker ${process.pid}`);
  });
  
  app.listen(3000);
}
```

---

## 14. What are Environment Variables?
**Answer:**
Environment variables store configuration outside code.

```javascript
// .env file
DATABASE_URL=mongodb://localhost
PORT=3000
NODE_ENV=development

// Access in code
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV === 'development';
```

---

## 15. What is the difference between exports and module.exports?
**Answer:**

```javascript
// module.exports (direct assignment)
module.exports = {
  name: 'My Module',
  getValue: () => 42
};

// exports (shortcut to module.exports)
exports.name = 'My Module';
exports.getValue = () => 42;

// Issue: Don't mix both
exports.x = 1;
module.exports = { y: 2 }; // exports.x is lost

// Import
const myModule = require('./myModule');
console.log(myModule.name);
```

---

## 16. What is package.json?
**Answer:**
Configuration file for Node.js project with metadata and dependencies.

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "description": "My application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^6.0.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^27.0.0"
  }
}
```

---

## 17. What is npm vs yarn vs pnpm?
**Answer:**
Package managers for Node.js.

| Feature | npm | yarn | pnpm |
|---------|-----|------|------|
| Speed | Medium | Fast | Fastest |
| Disk space | High | Medium | Low (hardlinks) |
| Lock file | package-lock.json | yarn.lock | pnpm-lock.yaml |
| Offline mode | No | Yes | Yes |
| Workspaces | Yes | Yes | Yes |

---

## 18. What are Destructuring and Spreading?
**Answer:**

```javascript
// Destructuring
const obj = { name: 'John', age: 30 };
const { name, age } = obj;

const arr = [1, 2, 3];
const [first, second] = arr;

// Default values
const { role = 'user' } = obj;
const [first, second = 0] = arr;

// Spreading
const obj2 = { ...obj, role: 'admin' };
const arr2 = [...arr, 4, 5];

// Rest parameters
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

---

## 19. What is try-catch and error handling?
**Answer:**

```javascript
try {
  const result = riskyOperation();
  console.log(result);
} catch (error) {
  console.error('Error:', error.message);
} finally {
  console.log('Cleanup');
}

// Throwing errors
if (!user) {
  throw new Error('User not found');
}

// Custom error class
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  throw new ValidationError('Invalid input');
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message);
  }
}
```

---

## 20. What is Callback Functions?
**Answer:**
Function passed as argument to another function, executed later.

```javascript
// Simple callback
function greeting(name, callback) {
  console.log('Hello ' + name);
  callback();
}

greeting('John', () => {
  console.log('Callback executed');
});

// Async callback (common in Node.js)
fs.readFile('file.txt', (err, data) => {
  if (err) {
    console.error(err);
  } else {
    console.log(data);
  }
});

// Array callbacks
const numbers = [1, 2, 3];
numbers.forEach(num => console.log(num)); // forEach
numbers.map(num => num * 2); // map
numbers.filter(num => num > 1); // filter
```

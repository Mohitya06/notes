# Practice Problems with Solutions

## JavaScript/React Practice Problems

### Easy (30 mins each)

#### 1. Implement a simple Pagination Component

```javascript
// Problem
Create a pagination component that displays page numbers and handles navigation

// Solution
function Pagination({ currentPage, totalPages, onPageChange }) {
  const pageNumbers = [];
  const maxButtons = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return (
    <div className="pagination">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      
      {pageNumbers.map(num => (
        <button
          key={num}
          className={num === currentPage ? 'active' : ''}
          onClick={() => onPageChange(num)}
        >
          {num}
        </button>
      ))}
      
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
```

---

#### 2. Implement Debounce

```javascript
// Problem: Create a debounce function that delays function execution

// Solution
function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// Usage
const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

input.addEventListener('change', (e) => {
  handleSearch(e.target.value);
});
```

---

#### 3. Implement Throttle

```javascript
// Problem: Execute function at most once every N milliseconds

// Solution
function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage
const handleScroll = throttle(() => {
  console.log('Scroll event');
}, 1000);

window.addEventListener('scroll', handleScroll);
```

---

#### 4. Implement Array.prototype.map

```javascript
// Problem: Implement map function from scratch

// Solution
Array.prototype.customMap = function(callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this));
  }
  return result;
};

// Test
const arr = [1, 2, 3];
const doubled = arr.customMap(x => x * 2);
console.log(doubled); // [2, 4, 6]
```

---

#### 5. Flatten Nested Array

```javascript
// Problem: Flatten nested arrays

// Solution - Recursive
function flatten(arr) {
  return arr.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

// Solution - Iterative
function flattenIterative(arr) {
  const stack = [...arr];
  const result = [];
  
  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item);
    } else {
      result.unshift(item);
    }
  }
  
  return result;
}

// Test
console.log(flatten([1, [2, [3, 4]]])); // [1, 2, 3, 4]
```

---

### Medium (1 hour each)

#### 1. Promise Polyfill

```javascript
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];
    
    const resolve = (value) => {
      if (this.state === 'pending') {
        this.state = 'fulfilled';
        this.value = value;
        this.onResolvedCallbacks.forEach(cb => cb());
      }
    };
    
    const reject = (reason) => {
      if (this.state === 'pending') {
        this.state = 'rejected';
        this.reason = reason;
        this.onRejectedCallbacks.forEach(cb => cb());
      }
    };
    
    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }
  
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handleFulfilled = () => {
        try {
          const result = onFulfilled(this.value);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      const handleRejected = () => {
        try {
          const result = onRejected(this.reason);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      if (this.state === 'fulfilled') {
        handleFulfilled();
      } else if (this.state === 'rejected') {
        handleRejected();
      } else {
        this.onResolvedCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
  }
}
```

---

#### 2. Implement useState Hook

```javascript
let componentHooks = [];
let hookIndex = 0;

function useState(initialValue) {
  const index = hookIndex;
  hookIndex++;
  
  if (componentHooks[index] === undefined) {
    componentHooks[index] = initialValue;
  }
  
  const setState = (newValue) => {
    componentHooks[index] = 
      typeof newValue === 'function' 
        ? newValue(componentHooks[index]) 
        : newValue;
    render();
  };
  
  return [componentHooks[index], setState];
}

// Usage
function MyComponent() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

---

#### 3. Implement Memoization

```javascript
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

// Usage
const expensiveFunction = memoize((n) => {
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += n;
  }
  return result;
});

expensiveFunction(5); // Computing...
expensiveFunction(5); // From cache
```

---

#### 4. Implement Compose Function

```javascript
function compose(...functions) {
  return (value) => {
    return functions.reduceRight((acc, fn) => fn(acc), value);
  };
}

// Usage
const add = (x) => x + 1;
const multiply = (x) => x * 2;
const subtract = (x) => x - 3;

const composed = compose(subtract, multiply, add);
console.log(composed(5)); // ((5 + 1) * 2) - 3 = 9
```

---

#### 5. Implement Deep Clone

```javascript
function deepClone(obj, visited = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (visited.has(obj)) return visited.get(obj);
  
  let cloned;
  
  if (Array.isArray(obj)) {
    cloned = [];
  } else if (obj instanceof Date) {
    cloned = new Date(obj);
  } else if (obj instanceof Set) {
    cloned = new Set([...obj].map(item => deepClone(item, visited)));
  } else if (obj instanceof Map) {
    cloned = new Map([...obj].map(([key, value]) => 
      [deepClone(key, visited), deepClone(value, visited)]
    ));
  } else {
    cloned = Object.create(Object.getPrototypeOf(obj));
  }
  
  visited.set(obj, cloned);
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key], visited);
    }
  }
  
  return cloned;
}

// Test
const original = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
const cloned = deepClone(original);
cloned.b.c = 999;
console.log(original.b.c); // 2
console.log(cloned.b.c); // 999
```

---

### Hard (1.5+ hours each)

#### 1. Implement Redux

```javascript
function createStore(reducer, initialState) {
  let state = initialState;
  let listeners = [];
  
  function getState() {
    return state;
  }
  
  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  }
  
  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }
  
  return {
    getState,
    dispatch,
    subscribe
  };
}

// Combine Reducers
function combineReducers(reducers) {
  return function(state = {}, action) {
    const newState = {};
    
    for (const key in reducers) {
      newState[key] = reducers[key](state[key], action);
    }
    
    return newState;
  };
}

// Usage
const counterReducer = (state = 0, action) => {
  switch(action.type) {
    case 'INCREMENT': return state + 1;
    case 'DECREMENT': return state - 1;
    default: return state;
  }
};

const store = createStore(counterReducer, 0);

store.subscribe(() => {
  console.log('State:', store.getState());
});

store.dispatch({ type: 'INCREMENT' }); // State: 1
store.dispatch({ type: 'INCREMENT' }); // State: 2
```

---

#### 2. Implement Event Emitter

```javascript
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }
  
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }
  
  off(event, listener) {
    if (!this.events[event]) return this;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    return this;
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      listener(...args);
    });
    
    return true;
  }
}

// Usage
const emitter = new EventEmitter();

emitter.on('message', (data) => {
  console.log('Received:', data);
});

emitter.once('once', () => {
  console.log('This runs once');
});

emitter.emit('message', 'Hello'); // Received: Hello
emitter.emit('once'); // This runs once
emitter.emit('once'); // Nothing
```

---

#### 3. Implement Caching with LRU

```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) return -1;
    
    // Move to end (most recently used)
    this.cache.delete(key);
    const value = this.cache.get(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    this.cache.set(key, value);
    
    if (this.cache.size > this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}

// Usage
const lru = new LRUCache(2);
lru.put(1, 'a');
lru.put(2, 'b');
console.log(lru.get(1)); // 'a'
lru.put(3, 'c'); // Evicts key 2
console.log(lru.get(2)); // -1 (not found)
```

---

## Node.js Backend Problems

### 1. Rate Limiting Middleware

```javascript
function createRateLimiter(windowMs, maxRequests) {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const timestamps = requests.get(ip);
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      t => now - t < windowMs
    );
    
    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    validTimestamps.push(now);
    requests.set(ip, validTimestamps);
    
    next();
  };
}

// Usage
app.use(createRateLimiter(60000, 10)); // 10 requests per minute
```

---

### 2. Retry Logic with Exponential Backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Usage
const result = await retryWithBackoff(async () => {
  const response = await fetch('https://api.example.com/data');
  if (!response.ok) throw new Error('API error');
  return response.json();
});
```

---

## System Design

### 1. URL Shortening Service

**Key Decisions:**
- Use base62 encoding for short URLs
- Redis for caching
- PostgreSQL for persistence
- API design: POST /shorten, GET /:short_url

### 2. Real-time Chat

**Key Decisions:**
- WebSockets for real-time messaging
- MongoDB for message storage
- Redis for online status
- Message queue for notifications

### 3. Weather Application

**Key Decisions:**
- Cache API responses
- Update every 30 minutes
- Store user preferences
- Handle API rate limiting

---

## Tips for Success

1. **Practice regularly** - 1-2 hours daily
2. **Explain your thinking** - Interviewers want to see your process
3. **Test your code** - Run examples to verify correctness
4. **Optimize after** - Get working solution first, then optimize
5. **Ask clarifying questions** - Ensure you understand the problem

---

## Common Mistakes to Avoid

- ❌ Not testing your code
- ❌ Not considering edge cases
- ❌ Over-complicating solutions
- ❌ Not explaining your approach
- ❌ Forgetting to handle errors

---

**Practice regularly and you'll ace those interviews! 🚀**

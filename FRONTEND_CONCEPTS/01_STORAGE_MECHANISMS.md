# Storage Mechanisms: localStorage, sessionStorage, Cookies & IndexedDB

## Overview
Storage mechanisms are essential for persisting data on the client-side. Each has different use cases, capabilities, and limitations.

---

## 1. localStorage

### What is localStorage?

localStorage is a browser API that stores data persistently (until explicitly deleted) with no expiration date.

### Characteristics
- **Persistence:** Until explicitly cleared
- **Scope:** Per domain (not shared across domains)
- **Capacity:** 5-10MB per domain
- **Synchronous:** Blocking operations
- **Access:** Accessible via JavaScript

### Usage

```javascript
// Set item
localStorage.setItem('user', JSON.stringify({ id: 1, name: 'John' }));
localStorage.setItem('theme', 'dark');

// Get item
const user = localStorage.getItem('user');
const userData = JSON.parse(user); // Parse JSON string

// Get all keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(key, localStorage.getItem(key));
}

// Remove item
localStorage.removeItem('user');

// Clear all
localStorage.clear();

// Check if key exists
if (localStorage.getItem('user')) {
  console.log('User data exists');
}
```

### Best Practices

```javascript
// 1. Handle storage quota exceeded
try {
  localStorage.setItem('largeData', hugeString);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    console.log('Storage quota exceeded');
    // Clear old data or notify user
  }
}

// 2. Use a storage manager
class StorageManager {
  static set(key, value, ttl = null) {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  static get(key) {
    const item = JSON.parse(localStorage.getItem(key));
    
    if (!item) return null;
    
    // Check if expired
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  }

  static remove(key) {
    localStorage.removeItem(key);
  }

  static clear() {
    localStorage.clear();
  }
}

// Usage
StorageManager.set('user', { id: 1, name: 'John' }, 24 * 60 * 60 * 1000); // 24h
const user = StorageManager.get('user');
```

### Use Cases
- Theme preferences (dark/light mode)
- User preferences
- Cached API responses
- Form data (draft saving)
- Application state

### Limitations
- 5-10MB limit
- Synchronous (can block UI)
- No automatic expiration
- Not secure (accessible via XSS)
- No granular permissions

---

## 2. sessionStorage

### What is sessionStorage?

sessionStorage is similar to localStorage but only persists for the current session (browser tab).

### Characteristics
- **Persistence:** Until tab is closed
- **Scope:** Per tab/window
- **Capacity:** 5-10MB per tab
- **Synchronous:** Blocking operations
- **Isolation:** Data not shared between tabs

### Usage

```javascript
// Set session data
sessionStorage.setItem('tempToken', 'abc123def456');
sessionStorage.setItem('formData', JSON.stringify(formState));

// Get session data
const token = sessionStorage.getItem('tempToken');

// Remove
sessionStorage.removeItem('tempToken');

// Clear all
sessionStorage.clear();

// Detect session end
window.addEventListener('beforeunload', (event) => {
  console.log('Session ending - clean up temporary data');
  sessionStorage.clear();
});
```

### Practical Example

```javascript
// Store form progress during session
class SessionFormManager {
  static AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  
  constructor(formName) {
    this.formName = formName;
    this.startAutoSave();
  }

  saveFormData(data) {
    sessionStorage.setItem(
      `form_${this.formName}`,
      JSON.stringify(data)
    );
  }

  getFormData() {
    const data = sessionStorage.getItem(`form_${this.formName}`);
    return data ? JSON.parse(data) : null;
  }

  clearFormData() {
    sessionStorage.removeItem(`form_${this.formName}`);
  }

  startAutoSave() {
    setInterval(() => {
      const form = document.querySelector(`form[data-name="${this.formName}"]`);
      if (form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        this.saveFormData(data);
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  static restoreForm(formName) {
    const data = sessionStorage.getItem(`form_${formName}`);
    if (data) {
      const form = document.querySelector(`form[data-name="${formName}"]`);
      if (form) {
        const values = JSON.parse(data);
        Object.entries(values).forEach(([key, value]) => {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = value;
        });
      }
    }
  }
}

// Usage
const checkout = new SessionFormManager('checkout');
// Form data is auto-saved during session
// Cleared when tab is closed
```

### Use Cases
- Temporary form data
- Session tokens (short-lived)
- Wizard/multi-step form state
- Per-session user preferences
- Temporary authentication states

### Limitations
- Lost when tab closes
- Not shared between tabs
- Limited to 5-10MB
- Synchronous operations

---

## 3. Cookies

### What are Cookies?

Cookies are small files stored on the client that are automatically sent with every HTTP request.

### Characteristics
- **Persistence:** Can be permanent or session-only
- **Scope:** Per domain (can specify path)
- **Capacity:** 4KB per cookie
- **Sent with Requests:** Automatically included in headers
- **Security:** Can be marked httpOnly, secure, sameSite

### Setting Cookies

```javascript
// Basic cookie
document.cookie = 'name=value';

// With expiration (expires in 7 days)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 7);
document.cookie = `name=value; expires=${expiryDate.toUTCString()}`;

// Secure cookie (HTTPS only)
document.cookie = 'token=abc123; secure; httpOnly; path=/';

// SameSite attribute (CSRF protection)
document.cookie = 'token=abc123; samesite=Strict';

// All options
document.cookie = 'sessionId=xyz789; ' +
  'expires=' + new Date(Date.now() + 86400000).toUTCString() + '; ' +
  'path=/; ' +
  'domain=example.com; ' +
  'secure; ' +
  'httpOnly; ' +
  'samesite=Strict';
```

### Reading Cookies

```javascript
// Read all cookies
const allCookies = document.cookie; // Returns: "name1=value1; name2=value2"

// Parse cookies
function getCookie(name) {
  const nameEQ = name + "=";
  const cookies = document.cookie.split(';');
  
  for(let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

// Usage
const username = getCookie('username');

// Get all cookies as object
function getAllCookies() {
  return document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.split('=');
    acc[key.trim()] = decodeURIComponent(value);
    return acc;
  }, {});
}

const cookies = getAllCookies();
console.log(cookies);
```

### Cookie Attributes

```
Domain=     - Which domain can access (default: current domain)
Path=       - Which paths can access (default: /)
Expires=    - Expiration date (GMT format)
Max-Age=    - Seconds until expiration
Secure      - Only sent over HTTPS
HttpOnly    - Cannot be accessed via JavaScript
SameSite=   - CSRF protection (Strict, Lax, None)
```

### Cookie Security

```javascript
// ❌ INSECURE - Accessible via XSS attacks
document.cookie = 'token=secret123';

// ✅ SECURE - Cannot be accessed via XSS
document.cookie = 'token=secret123; httpOnly; secure; samesite=Strict';

// Server should set cookies (more secure)
// Response-Header: Set-Cookie: token=secret123; HttpOnly; Secure; SameSite=Strict

// CSRF Protection Example
function getCsrfToken() {
  return getCookie('csrf-token');
}

function makeAuthenticatedRequest(url, method = 'POST', data = {}) {
  const csrfToken = getCsrfToken();
  
  return fetch(url, {
    method,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(data)
  });
}
```

### Cookie Manager Class

```javascript
class CookieManager {
  static set(name, value, options = {}) {
    const {
      expires = 7, // days
      path = '/',
      secure = true,
      httpOnly = true,
      sameSite = 'Strict'
    } = options;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expires);

    let cookieString = `${name}=${encodeURIComponent(value)}`;
    cookieString += `; expires=${expiryDate.toUTCString()}`;
    cookieString += `; path=${path}`;
    
    if (secure) cookieString += '; secure';
    if (httpOnly) cookieString += '; httpOnly';
    if (sameSite) cookieString += `; samesite=${sameSite}`;

    document.cookie = cookieString;
  }

  static get(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(nameEQ)) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  static remove(name) {
    this.set(name, '', { expires: -1 });
  }

  static getAll() {
    const cookies = {};
    document.cookie.split(';').forEach(cookie => {
      const [key, value] = cookie.split('=');
      if (key.trim()) {
        cookies[key.trim()] = decodeURIComponent(value);
      }
    });
    return cookies;
  }
}

// Usage
CookieManager.set('token', 'abc123', { 
  expires: 7, 
  secure: true, 
  httpOnly: true 
});

const token = CookieManager.get('token');
CookieManager.remove('token');
```

### Use Cases
- Authentication tokens (JWT)
- Session IDs
- User preferences
- Analytics tracking
- CSRF tokens
- Cross-origin requests (with SameSite)

### Limitations
- 4KB limit per cookie
- Sent with every request (overhead)
- Not secure if not marked httpOnly
- Limited to 180 cookies per domain

---

## 4. IndexedDB

### What is IndexedDB?

IndexedDB is a low-level API for storing large amounts of structured data client-side.

### Characteristics
- **Capacity:** 50MB+ (depends on browser)
- **Asynchronous:** Non-blocking operations
- **Structured:** Supports complex data types
- **Queryable:** Supports indexes and ranges
- **Transactions:** ACID compliance

### Basic Usage

```javascript
// Open/Create database
const request = indexedDB.open('myDB', 1);

request.onerror = () => console.error('Failed to open DB');
request.onsuccess = (event) => {
  const db = event.target.result;
  console.log('Database opened');
};

// Create object store (run on upgrade)
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  
  // Create object store
  const objectStore = db.createObjectStore('users', { keyPath: 'id' });
  
  // Create indexes
  objectStore.createIndex('email', 'email', { unique: true });
  objectStore.createIndex('name', 'name', { unique: false });
};
```

### CRUD Operations

```javascript
// IndexedDB Manager
class IndexedDBManager {
  constructor(dbName, version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        this.onUpgrade(event);
      };
    });
  }

  onUpgrade(event) {
    // Override in subclass to create stores
  }

  // Create (Add)
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Read
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Update
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Query with index
  async query(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// User-specific implementation
class UserDB extends IndexedDBManager {
  constructor() {
    super('userDB', 1);
  }

  onUpgrade(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('users')) {
      const store = db.createObjectStore('users', { keyPath: 'id' });
      store.createIndex('email', 'email', { unique: true });
      store.createIndex('name', 'name', { unique: false });
    }
  }
}

// Usage
async function manageUsers() {
  const userDB = new UserDB();
  await userDB.open();

  // Add user
  await userDB.add('users', { 
    id: 1, 
    name: 'John', 
    email: 'john@example.com' 
  });

  // Get user
  const user = await userDB.get('users', 1);
  console.log(user);

  // Query by index
  const users = await userDB.query('users', 'email', 'john@example.com');
  console.log(users);

  // Get all
  const allUsers = await userDB.getAll('users');
  console.log(allUsers);
}
```

### Use Cases
- Large offline data storage
- Client-side caching
- Offline-first applications
- Real-time collaborative apps
- Progressive Web Apps
- Complex queries

### Advantages over localStorage
- Larger storage (50MB+)
- Asynchronous (non-blocking)
- Supports complex data types
- Queryable with indexes
- Transactions

---

## 5. Comparison Table

| Feature | localStorage | sessionStorage | Cookies | IndexedDB |
|---------|-------------|----------------|---------|-----------|
| **Capacity** | 5-10MB | 5-10MB | 4KB | 50MB+ |
| **Persistence** | Permanent | Session | Can be permanent | Permanent |
| **Access** | Synchronous | Synchronous | Automatic | Asynchronous |
| **Sent with requests** | No | No | Yes | No |
| **Queryable** | No | No | No | Yes |
| **Security** | XSS vulnerable | XSS vulnerable | Can be httpOnly | Safe |
| **Complex data** | Limited | Limited | Limited | Yes |
| **Browser support** | Excellent | Excellent | Excellent | Good |

---

## 6. Best Practices

### Security
```javascript
// ❌ WRONG - Storing sensitive data
localStorage.setItem('password', userPassword);

// ✅ RIGHT - Never store sensitive data
// Use httpOnly cookies for sensitive data
// Server should set sensitive cookies

// ❌ WRONG - XSS vulnerable
localStorage.setItem('userData', userInput);

// ✅ RIGHT - Sanitize input
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(userInput);
localStorage.setItem('userData', sanitized);
```

### Performance
```javascript
// ❌ WRONG - Multiple synchronous access
for (let i = 0; i < 1000; i++) {
  localStorage.setItem(`key${i}`, `value${i}`);
}

// ✅ RIGHT - Batch operations
const data = {};
for (let i = 0; i < 1000; i++) {
  data[`key${i}`] = `value${i}`;
}
localStorage.setItem('batch', JSON.stringify(data));
```

### Monitoring Storage
```javascript
// Check available storage
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;
    console.log(`Storage used: ${percentUsed.toFixed(2)}%`);
  }
}

// Request persistent storage
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const persistent = await navigator.storage.persist();
    console.log(`Persistent storage: ${persistent}`);
  }
}
```

---

This comprehensive storage guide covers all major client-side storage mechanisms with practical examples and best practices!

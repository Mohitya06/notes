# API Integration: REST, GraphQL, Fetch vs Axios & Error Handling

## 1. REST APIs

### Basic Fetch API

```javascript
// GET request
async function getUsers() {
  try {
    const response = await fetch('/api/users');
    
    // Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// POST request
async function createUser(userData) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  return response.json();
}

// PUT request (full update)
async function updateUser(userId, userData) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
}

// PATCH request (partial update)
async function partialUpdateUser(userId, updates) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return response.json();
}

// DELETE request
async function deleteUser(userId) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE'
  });
  return response.ok;
}
```

### Axios vs Fetch

```javascript
// ===== AXIOS =====
import axios from 'axios';

// Create instance with defaults
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET
const users = await api.get('/users');

// POST
await api.post('/users', { name: 'John' });

// Interceptor for auth
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== FETCH =====
// Need to handle auth headers manually
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : ''
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    window.location.href = '/login';
  }
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Comparison:
// Fetch: Built-in, smaller bundle, requires more boilerplate
// Axios: Feature-rich, interceptors, easier error handling
```

---

## 2. GraphQL

### Apollo Client Setup

```javascript
import { ApolloClient, InMemoryCache, HttpLink, ApolloProvider } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: 'http://localhost:4000/graphql',
    credentials: 'include' // Send cookies
  }),
  cache: new InMemoryCache()
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Dashboard />
    </ApolloProvider>
  );
}
```

### GraphQL Queries & Mutations

```javascript
import { gql, useQuery, useMutation } from '@apollo/client';

// Query
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function UsersList() {
  const { data, loading, error } = useQuery(GET_USERS);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Mutation
const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
    }
  }
`;

function CreateUserForm() {
  const [createUser] = useMutation(CREATE_USER);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data } = await createUser({
      variables: {
        name: e.target.name.value,
        email: e.target.email.value
      }
    });
    console.log('Created:', data.createUser);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 3. Error Handling

### Comprehensive Error Handler

```javascript
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

// Error handler wrapper
async function handleRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    // Handle different status codes
    if (response.status === 401) {
      throw new APIError('Unauthorized', 401);
    }
    if (response.status === 403) {
      throw new APIError('Forbidden', 403);
    }
    if (response.status === 404) {
      throw new APIError('Not Found', 404);
    }
    if (response.status >= 500) {
      throw new APIError('Server Error', response.status);
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(
        errorData.message || 'Request failed',
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      error.message || 'Network error',
      0,
      { originalError: error }
    );
  }
}

// React Hook for API calls
function useAPI(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        const result = await handleRequest(url, options);
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false; // Cleanup
    };
  }, [url, options]);

  return { data, loading, error };
}

// Usage
function UserProfile({ userId }) {
  const { data: user, loading, error } = useAPI(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{user.name}</div>;
}
```

---

## 4. Request Interceptors

### Axios Interceptors

```javascript
// Create API instance
const api = axios.create({
  baseURL: '/api'
});

// Request interceptor
api.interceptors.request.use(
  config => {
    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateUUID();

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', config.method.toUpperCase(), config.url);
    }

    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  response => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', response.status, response.data);
    }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle 401 - refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post('/auth/refresh');
        const { token } = response.data;
        localStorage.setItem('token', token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### Fetch Interceptor Pattern

```javascript
class FetchInterceptor {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  async request(url, options = {}) {
    let config = { url, ...options };

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = await interceptor(config);
    }

    // Make request
    let response = await fetch(config.url, config);

    // Apply response interceptors
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    return response;
  }
}

// Usage
const api = new FetchInterceptor();

// Add request interceptor
api.addRequestInterceptor(async config => {
  const token = localStorage.getItem('token');
  return {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
  };
});

// Add response interceptor
api.addResponseInterceptor(async response => {
  if (response.status === 401) {
    // Handle refresh token
    const refreshed = await refreshToken();
    if (refreshed) {
      return api.request(response.url, response);
    }
  }
  return response;
});

// Make request
const data = await api.request('/api/users');
```

---

## 5. Retry Logic

### Retry with Exponential Backoff

```javascript
async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  backoffMs = 1000
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Retry on server errors (5xx)
      if (response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = backoffMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} in ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const response = await fetchWithRetry('/api/users', {}, 3, 1000);
  const data = await response.json();
} catch (error) {
  console.error('Failed after retries:', error);
}
```

---

## 6. Polling & Real-time

### Polling

```javascript
function usePolling(fetchFn, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pollInterval;

    async function poll() {
      try {
        setLoading(true);
        const result = await fetchFn();
        setData(result);
      } catch (error) {
        console.error('Polling error:', error);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    poll();

    // Setup polling
    pollInterval = setInterval(poll, interval);

    return () => clearInterval(pollInterval);
  }, [fetchFn, interval]);

  return { data, loading };
}

// Usage
function LiveStats() {
  const { data: stats } = usePolling(
    () => fetch('/api/stats').then(r => r.json()),
    5000 // Poll every 5 seconds
  );

  return <div>Stats: {stats?.count}</div>;
}
```

### WebSockets (Real-time)

```javascript
function useWebSocket(url) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      setData(JSON.parse(event.data));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    return () => ws.close();
  }, [url]);

  return { data, connected };
}

// Usage
function LiveNotifications() {
  const { data: notification } = useWebSocket('wss://api.example.com/notifications');

  return <div>{notification?.message}</div>;
}
```

---

## 7. Caching Strategy

### Request Caching

```javascript
class APICache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, ttl = this.ttl) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check expiry
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.match(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new APICache();

async function fetchUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    console.log('Using cached data');
    return cached;
  }

  const response = await fetch(`/api/users/${userId}`);
  const data = await response.json();

  // Cache for 10 minutes
  cache.set(cacheKey, data, 10 * 60 * 1000);

  return data;
}

// Invalidate cache when user is updated
async function updateUser(userId, updates) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });

  const data = await response.json();

  // Invalidate user cache
  cache.invalidate(new RegExp(`^user:${userId}`));

  return data;
}
```

---

This comprehensive API integration guide covers all major approaches with practical examples!

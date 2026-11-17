# React.js - Level 2 (Intermediate)

## 1. What is React.memo and when to use it?
**Answer:**
React.memo is a higher-order component that memoizes a component and only re-renders if props change.

```jsx
const MyComponent = React.memo(function MyComponent(props) {
  return <div>{props.value}</div>;
});

// With custom comparison
const MyComponent = React.memo(
  function MyComponent(props) {
    return <div>{props.value}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.value === nextProps.value;
  }
);
```

**When to use:**
- Component receives same props frequently
- Component is expensive to render
- Parent re-renders often

---

## 2. Explain Reconciliation in React
**Answer:**
Reconciliation is the process React uses to determine what has changed:

1. React renders components to Virtual DOM
2. React compares new Virtual DOM with previous Virtual DOM
3. React calculates minimal set of changes needed
4. React updates only those parts in actual DOM

Key algorithm: **Fiber Architecture** - breaks rendering into chunks, allowing pausing and resuming.

---

## 3. What is the Fiber Architecture?
**Answer:**
Fiber is React's new rendering engine (introduced in React 16).

**Key features:**
- Incremental rendering: split rendering into phases
- Pause rendering work and prioritize other work
- Reuse previously completed work
- Abort work if it's no longer needed
- Priority levels: Immediate, User Blocking, Normal, Low, Idle

Improves performance and enables concurrent features.

---

## 4. What is Suspense and code splitting?
**Answer:**
Suspense lets components suspend rendering while loading data. Used with code splitting for lazy loading components.

```jsx
import { Suspense, lazy } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
```

**Benefits:**
- Split code into smaller chunks
- Load only what's needed
- Improve initial load time

---

## 5. What is Context API and how does it work?
**Answer:**
Context API provides a way to pass data without prop drilling.

```jsx
import { createContext, useState, useContext } from 'react';

const MyContext = createContext();

function Provider({ children }) {
  const [value, setValue] = useState('initial');
  
  return (
    <MyContext.Provider value={{ value, setValue }}>
      {children}
    </MyContext.Provider>
  );
}

function Consumer() {
  const { value, setValue } = useContext(MyContext);
  return <div>{value}</div>;
}
```

**When to use:**
- Theme switching
- User authentication
- Global settings
- Not for frequently changing data (use Redux instead)

---

## 6. Explain Custom Hooks
**Answer:**
Custom hooks are JavaScript functions that use other hooks. They let you extract component logic into reusable functions.

```jsx
// Custom hook for fetching data
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);
  
  return { data, loading, error };
}

// Usage
function Component() {
  const { data, loading, error } = useFetch('/api/data');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return <div>{data}</div>;
}
```

---

## 7. What is Compound Components Pattern?
**Answer:**
Compound components use multiple components together to form a single unit.

```jsx
function Menu({ children }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div>
      {React.Children.map(children, child =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  );
}

function MenuTrigger({ open, setOpen }) {
  return <button onClick={() => setOpen(!open)}>Menu</button>;
}

function MenuContent({ open, children }) {
  return open ? <div>{children}</div> : null;
}

// Usage
<Menu>
  <MenuTrigger />
  <MenuContent>
    <MenuItem>Item 1</MenuItem>
  </MenuContent>
</Menu>
```

---

## 8. What is React Portals?
**Answer:**
Portals allow rendering a component outside its parent's DOM hierarchy, usually for modals, tooltips, dropdowns.

```jsx
import { createPortal } from 'react-dom';

function Modal({ children, onClose }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal">{children}</div>
    </div>,
    document.getElementById('modal-root')
  );
}
```

**Benefits:**
- Avoid CSS overflow/z-index issues
- Better for modals and overlays
- Cleaner DOM structure

---

## 9. Explain Performance Optimization in React
**Answer:**
Common optimization techniques:

1. **Code Splitting:** Load code on-demand
```jsx
const Component = lazy(() => import('./Component'));
```

2. **Memoization:** React.memo, useMemo, useCallback
```jsx
const MemoComponent = React.memo(Component);
```

3. **Key prop:** Proper identification of list items
```jsx
{items.map(item => <Item key={item.id} />)}
```

4. **useReducer instead of useState:** For complex state
5. **Image optimization:** Use next/image
6. **Bundle analysis:** Identify large dependencies
7. **Avoid inline functions:** Define outside or use useCallback
8. **Virtual scrolling:** For long lists

---

## 10. What is the useRef Hook?
**Answer:**
useRef returns a mutable container that persists across renders without causing re-renders.

```jsx
import { useRef } from 'react';

function TextInput() {
  const inputRef = useRef(null);
  
  const focusInput = () => {
    inputRef.current.focus();
  };
  
  return (
    <>
      <input ref={inputRef} />
      <button onClick={focusInput}>Focus</button>
    </>
  );
}

// Persist timer ID
function Timer() {
  const intervalRef = useRef(null);
  
  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      // timer logic
    }, 1000);
  };
  
  const stopTimer = () => {
    clearInterval(intervalRef.current);
  };
  
  return <>{/* JSX */}</>;
}
```

---

## 11. What is Error Boundary?
**Answer:**
Error boundaries catch errors during rendering and display fallback UI.

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.log('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong: {this.state.error.message}</h1>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## 12. Explain Server-Side Rendering (SSR) in React
**Answer:**
SSR renders React components on the server and sends HTML to client.

**Benefits:**
- Better SEO
- Faster initial page load
- Content available before JavaScript loads

**Implementation with Next.js:**
```jsx
// pages/index.js
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/data');
  const data = await res.json();
  
  return {
    props: { data },
    revalidate: 60 // ISR
  };
}

export default function Home({ data }) {
  return <div>{data}</div>;
}
```

---

## 13. What is Static Generation (SSG)?
**Answer:**
SSG generates static HTML at build time, improving performance for static content.

```jsx
// In Next.js
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: { data },
    revalidate: 3600 // Revalidate every hour (ISR)
  };
}

export async function getStaticPaths() {
  return {
    paths: [{ params: { id: '1' } }],
    fallback: 'blocking'
  };
}
```

---

## 14. What is Incremental Static Regeneration (ISR)?
**Answer:**
ISR allows updating static content after deployment without rebuilding entire site.

```jsx
export async function getStaticProps() {
  const posts = await getPosts();
  
  return {
    props: { posts },
    revalidate: 10 // Regenerate every 10 seconds
  };
}
```

Every 10 seconds, on-demand, the page is regenerated and cached.

---

## 15. Explain Redux Pattern (State Management)
**Answer:**
Redux is a predictable state container for JavaScript apps.

```jsx
import { createSlice, configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

// Slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: 0,
  reducers: {
    increment: (state) => state + 1,
    decrement: (state) => state - 1
  }
});

// Store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

// Component
function Counter() {
  const dispatch = useDispatch();
  const count = useSelector(state => state.counter);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(counterSlice.actions.increment())}>+</button>
    </div>
  );
}
```

---

## 16. What is Zustand?
**Answer:**
Zustand is a lightweight state management library, simpler alternative to Redux.

```jsx
import create from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 }))
}));

function Counter() {
  const { count, increment, decrement } = useStore();
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}
```

---

## 17. What is React Query (TanStack Query)?
**Answer:**
React Query simplifies data fetching, caching, and synchronization.

```jsx
import { useQuery } from '@tanstack/react-query';

function Posts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await fetch('/api/posts');
      return res.json();
    },
    staleTime: 60000, // Data stale after 1 minute
    cacheTime: 300000 // Keep in cache for 5 minutes
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data.map(post => <div key={post.id}>{post.title}</div>)}</div>;
}
```

**Features:**
- Automatic caching
- Stale data handling
- Background refetching
- Optimistic updates

---

## 18. What is Server Components (React 18+)?
**Answer:**
Server Components render on server only, no JavaScript sent to client.

```jsx
// ServerComponent.jsx (runs only on server)
async function ServerComponent() {
  const data = await fetch('https://api.example.com/data');
  return <div>{data}</div>;
}

// ClientComponent.jsx (runs on client)
'use client';
import { useState } from 'react';

export default function ClientComponent() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

**Benefits:**
- Reduced JavaScript bundle
- Direct database access from components
- Better security (API keys stay on server)

---

## 19. What are Web Vitals and how to optimize?
**Answer:**
Key metrics for website performance:

1. **LCP (Largest Contentful Paint):** < 2.5s
   - Optimize images
   - Use lazy loading
   - Minimize CSS/JS

2. **FID (First Input Delay):** < 100ms
   - Defer non-critical JS
   - Use code splitting
   - Optimize long tasks

3. **CLS (Cumulative Layout Shift):** < 0.1
   - Set dimensions for images/videos
   - Avoid inserting content above existing content

```jsx
import { useEffect } from 'react';

function useWebVitals() {
  useEffect(() => {
    // Measure LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }, []);
}
```

---

## 20. What is Next.js and its advantages?
**Answer:**
Next.js is a React framework with built-in:
- SSR and SSG
- File-based routing
- API routes
- Image optimization
- Code splitting
- CSS modules and Tailwind CSS

```jsx
// pages/api/hello.js (API route)
export default function handler(req, res) {
  res.status(200).json({ message: 'Hello' });
}

// pages/index.js
export default function Home() {
  return <h1>Welcome</h1>;
}
```

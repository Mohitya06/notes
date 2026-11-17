# React.js - Level 3 (Advanced)

## 1. How does React Concurrent Rendering work?
**Answer:**
Concurrent rendering allows React to interrupt rendering to handle higher-priority updates.

**Before Concurrent:**
- All rendering is synchronous and blocks the main thread

**With Concurrent:**
- Rendering can be paused and resumed
- Long tasks don't block user interactions
- Prioritization: Immediate > User Blocking > Normal > Low > Idle

```jsx
// Using startTransition for non-urgent updates
import { startTransition } from 'react';

function Component() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // Urgent
    
    startTransition(() => {
      // Non-urgent filtering
      const filtered = largeDataSet.filter(item => 
        item.name.includes(value)
      );
      setResults(filtered);
    });
  };
  
  return (
    <>
      <input onChange={handleSearch} value={searchTerm} />
      {/* Show results even if filtering is pending */}
      <Results data={results} />
    </>
  );
}
```

---

## 2. Explain React Suspense in depth
**Answer:**
Suspense handles async operations (data fetching, component loading) and shows fallback UI while waiting.

**Features:**
- Suspense Boundaries
- Automatic retry on error
- Composition of async operations

```jsx
import { Suspense } from 'react';
import { useAsyncValue } from 'react/experimental';

function DataComponent() {
  // This component can suspend
  const data = useAsyncValue();
  return <div>{data}</div>;
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorBoundary fallback={<Error />}>
        <DataComponent />
      </ErrorBoundary>
    </Suspense>
  );
}
```

**Integration with streaming:**
```jsx
// Server streaming
function App() {
  return (
    <Suspense fallback={<div>Loading posts...</div>}>
      <Posts />
    </Suspense>
  );
}
```

---

## 3. What is Automatic Batching in React 18?
**Answer:**
React 18 automatically batches multiple state updates into a single render.

**Before React 18:**
```jsx
// Each update causes a separate render
function handleClick() {
  setState1(a);
  setState2(b);
  setState3(c);
  // 3 renders
}

// Inside async, updates were NOT batched
setTimeout(() => {
  setState1(a);
  setState2(b);
  // 2 renders (in React 17)
}, 100);
```

**React 18:**
```jsx
// Automatically batched - 1 render
function handleClick() {
  setState1(a);
  setState2(b);
  setState3(c);
}

// Also batched now - 1 render
setTimeout(() => {
  setState1(a);
  setState2(b);
}, 100);

// Even in event handlers - 1 render
promise.then(() => {
  setState1(a);
  setState2(b);
});
```

**Opt-out with flushSync:**
```jsx
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => setState1(a)); // Immediate render
  setState2(b); // Batched with next updates
}
```

---

## 4. Explain useTransition and useDeferredValue
**Answer:**
Tools for handling non-urgent updates in concurrent rendering.

**useTransition:**
```jsx
import { useTransition } from 'react';

function SearchResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();
  
  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // Urgent
    
    startTransition(() => {
      // Non-urgent computation
      const newResults = expensiveSearch(value);
      setResults(newResults);
    });
  };
  
  return (
    <div>
      <input onChange={handleChange} value={searchTerm} />
      {isPending && <div>Loading...</div>}
      <ResultsList results={results} />
    </div>
  );
}
```

**useDeferredValue:**
```jsx
import { useDeferredValue } from 'react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  return (
    <div>
      <input 
        onChange={(e) => setSearchTerm(e.target.value)} 
        value={searchTerm}
      />
      {/* Uses deferred value, updates slower */}
      <SearchResults searchTerm={deferredSearchTerm} />
    </div>
  );
}
```

**Difference:**
- useTransition: Explicit marking of non-urgent updates
- useDeferredValue: Automatic deferral of value updates

---

## 5. What is React 18 useId Hook?
**Answer:**
useId generates unique IDs for accessibility and form handling.

```jsx
import { useId } from 'react';

function SearchForm() {
  const id = useId();
  
  return (
    <>
      <label htmlFor={`${id}-search`}>Search:</label>
      <input id={`${id}-search`} />
      
      <label htmlFor={`${id}-filter`}>Filter:</label>
      <select id={`${id}-filter`} />
    </>
  );
}
```

**Benefits:**
- No collisions with server-rendered components
- Unique across re-renders
- Stable across client/server

---

## 6. Explain Advanced Redux Patterns
**Answer:**
**Redux Middleware:**
```jsx
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(customMiddleware)
});

const customMiddleware = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('New State:', store.getState());
  return result;
};
```

**Async Thunks:**
```jsx
import { createAsyncThunk } from '@reduxjs/toolkit';

const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/posts');
      return res.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: { data: [], loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});
```

---

## 7. What is Immer and why use it with Redux?
**Answer:**
Immer allows writing "mutative" code that produces immutable state.

```jsx
import { produce } from 'immer';

// Without Immer (complex)
const addTodo = (state, todo) => {
  return {
    ...state,
    todos: [
      ...state.todos,
      {
        ...todo,
        comments: [
          ...todo.comments,
          { id: 1, text: 'Great!' }
        ]
      }
    ]
  };
};

// With Immer (simple)
const addTodo = (state, todo) => {
  return produce(state, draft => {
    draft.todos.push({
      ...todo,
      comments: [{ id: 1, text: 'Great!' }]
    });
  });
};

// Redux Toolkit uses Immer by default
const todoSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    addTodo: (state, action) => {
      state.push(action.payload); // Mutate safely
    }
  }
});
```

---

## 8. Explain Render Props vs Hooks vs HOC
**Answer:**

**HOC:**
```jsx
const withData = (Component) => (props) => {
  const data = useData();
  return <Component data={data} {...props} />;
};
```
- Reuse logic
- Higher complexity
- Wrapper hell
- Props collision

**Render Props:**
```jsx
<Data>
  {data => <Component data={data} />}
</Data>
```
- Fine-grained control
- Less maintainable
- Harder to debug

**Hooks (Recommended):**
```jsx
function Component() {
  const data = useData();
  return <div>{data}</div>;
}
```
- Simpler and cleaner
- Better code organization
- Easier to share logic
- No wrapper hell

---

## 9. What are Generics in TypeScript React?
**Answer:**
Generics allow type-safe reusable components.

```tsx
// Generic component
interface Props<T> {
  items: T[];
  render: (item: T) => React.ReactNode;
}

function List<T>({ items, render }: Props<T>) {
  return <ul>{items.map(render)}</ul>;
}

// Usage
<List<string>
  items={['a', 'b', 'c']}
  render={(item) => <li>{item}</li>}
/>

// Generic API hook
function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json() as Promise<T>)
      .then(setData);
  }, [url]);
  
  return data;
}

// Usage
const posts = useApi<Post[]>('/api/posts');
```

---

## 10. What is Resource Hints (DNS prefetch, Preconnect, Preload)?
**Answer:**
Performance optimization techniques:

**DNS Prefetch:** Resolve DNS early
```html
<link rel="dns-prefetch" href="//example.com" />
```

**Preconnect:** Establish connection early
```html
<link rel="preconnect" href="//cdn.example.com" />
```

**Preload:** Load critical resources early
```html
<link rel="preload" href="font.woff2" as="font" />
<link rel="preload" href="critical.css" as="style" />
```

**Prefetch:** Low-priority fetch for future navigation
```html
<link rel="prefetch" href="/next-page" />
```

In React:
```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = 'https://api.example.com';
    document.head.appendChild(link);
  }, []);
  
  return <div>App</div>;
}
```

---

## 11. Explain React DevTools Profiler
**Answer:**
Profiler measures performance of React components.

**Features:**
- Record render time per component
- Identify unnecessary renders
- Track component lifecycle
- Export performance data

**Manual API:**
```jsx
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration, baseDuration) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

<Profiler id="app" onRender={onRenderCallback}>
  <App />
</Profiler>
```

---

## 12. What is Code Splitting with Webpack?
**Answer:**
Break code into chunks and load on-demand.

**Webpack Configuration:**
```js
// webpack.config.js
module.exports = {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    }
  }
};
```

**Dynamic Imports:**
```jsx
const HeavyComponent = React.lazy(() =>
  import('./HeavyComponent')
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

---

## 13. What is React Strict Mode?
**Answer:**
Development tool highlighting potential issues.

```jsx
import { StrictMode } from 'react';

<StrictMode>
  <App />
</StrictMode>
```

**What it does:**
- Renders components twice to detect mutations
- Checks for deprecated APIs
- Warns about side effects in render
- Validates Fragment keys

---

## 14. Explain useLayoutEffect vs useEffect
**Answer:**

**useEffect:**
- Runs AFTER render and paint
- Doesn't block visual updates
- Good for data fetching, subscriptions
- Most common

**useLayoutEffect:**
- Runs AFTER render but BEFORE paint
- Blocks visual updates
- Synchronous
- Use for DOM measurements

```jsx
// useEffect (async)
useEffect(() => {
  // Run after render
  document.title = `Count: ${count}`;
}, [count]);

// useLayoutEffect (sync)
useLayoutEffect(() => {
  // Run before paint - use for measurements
  const height = ref.current.clientHeight;
  setLayout({ height });
}, []);
```

---

## 15. What is FlushSync and when to use it?
**Answer:**
Forces synchronous flush of updates.

```jsx
import { flushSync } from 'react-dom';

function Component() {
  const [count, setCount] = useState(0);
  
  const handleClick = () => {
    flushSync(() => setCount(count + 1)); // Renders immediately
    // DOM is updated here
    console.log(ref.current.textContent); // New value
  };
  
  return <div ref={ref}>{count}</div>;
}
```

**When to use:**
- Coordinating with non-React code
- Reading DOM after update
- Rare use cases (usually need refactoring)

---

## 16. What is React Compiler?
**Answer:**
Automatic memoization of components (React 19+).

Before:
```jsx
function Component({ count }) {
  const value = expensiveCalculation(count);
  return <div>{value}</div>;
}
```

With Compiler: Automatically optimized, no need for useMemo.

---

## 17. Explain Actions and useFormStatus (React 19)
**Answer:**
Simplified form handling with server actions.

```jsx
'use server';
// Server action
export async function submitForm(formData) {
  const name = formData.get('name');
  // Save to database
  return { success: true };
}

'use client';
import { useFormStatus } from 'react-dom';

function Form() {
  const { pending } = useFormStatus();
  
  return (
    <form action={submitForm}>
      <input name="name" />
      <button disabled={pending}>
        {pending ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 18. What is Interleaving and Time Slicing?
**Answer:**
Concurrent features in React Fiber architecture.

**Time Slicing:**
- Break rendering into chunks
- Give browser time to handle events
- Resume rendering

**Interleaving:**
- Pause high-priority updates
- Resume after urgent work

```jsx
// High priority (urgent)
setSearchTerm(value);

// Low priority (can be interleaved)
startTransition(() => {
  setResults(filterResults(value));
});
```

---

## 19. Explain React Hydration
**Answer:**
Attaching event listeners to server-rendered HTML.

```jsx
// Server (Next.js)
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

export default function Page({ data }) {
  return <div>{data}</div>;
}

// Process:
// 1. Server renders to HTML
// 2. HTML sent to client
// 3. Client downloads React JS
// 4. React hydrates: matches rendered tree with interactive tree
// 5. Event listeners attached
```

**Hydration Mismatch Error:**
```jsx
// Causes mismatch (timestamp differs)
function Component() {
  const [date] = useState(new Date().toISOString());
  return <div>{date}</div>;
}

// Fix: use useEffect
function Component() {
  const [date, setDate] = useState('');
  
  useEffect(() => {
    setDate(new Date().toISOString());
  }, []);
  
  return date ? <div>{date}</div> : null;
}
```

---

## 20. What is React 19 use() Hook?
**Answer:**
Unwrap promises and read async values in components.

```jsx
import { use } from 'react';

async function fetchData() {
  const res = await fetch('/api/data');
  return res.json();
}

function Component({ promise }) {
  const data = use(promise); // Unwraps promise
  return <div>{data}</div>;
}

// Wrapped in Suspense
<Suspense fallback={<Loading />}>
  <Component promise={fetchData()} />
</Suspense>
```

Similar to Suspense for reading values synchronously.

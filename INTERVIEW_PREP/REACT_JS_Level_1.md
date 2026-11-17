# React.js - Level 1 (Fundamentals)

## 1. What is React and why is it used?
**Answer:**
React is a JavaScript library for building user interfaces using reusable components. It uses a virtual DOM to optimize rendering performance and makes building interactive UIs easier through:
- Component reusability
- Unidirectional data flow
- Virtual DOM for performance optimization
- Easy to learn and implement

---

## 2. What is JSX?
**Answer:**
JSX is JavaScript XML syntax extension that allows writing HTML-like code in JavaScript. It's not valid JavaScript and must be compiled to function calls.

```jsx
// JSX syntax
const element = <h1>Hello World</h1>;

// Compiled to
const element = React.createElement('h1', null, 'Hello World');
```

---

## 3. Explain the difference between functional and class components
**Answer:**

| Feature | Functional | Class |
|---------|-----------|-------|
| Syntax | Regular JavaScript function | ES6 class extending React.Component |
| State | Hooks (useState) | this.state |
| Lifecycle | useEffect hook | Lifecycle methods |
| Return | JSX | JSX from render() |
| Performance | Lightweight | Heavier |
| Recommended | Modern React approach | Legacy (still supported) |

```jsx
// Functional Component
function Welcome(props) {
  return <h1>Hello {props.name}</h1>;
}

// Class Component
class Welcome extends React.Component {
  render() {
    return <h1>Hello {this.props.name}</h1>;
  }
}
```

---

## 4. What are Hooks and why were they introduced?
**Answer:**
Hooks are functions that let you use state and other features without writing class components. Introduced in React 16.8 to:
- Reuse stateful logic across components
- Split complex components into smaller functions
- Avoid "wrapper hell"

Common hooks: useState, useEffect, useContext, useReducer

---

## 5. Explain useState Hook
**Answer:**
useState allows functional components to have state. It returns an array with current state value and function to update it.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

---

## 6. Explain useEffect Hook
**Answer:**
useEffect runs side effects after render. It replaces componentDidMount, componentDidUpdate, and componentWillUnmount lifecycle methods.

```jsx
import { useEffect } from 'react';

function Component() {
  useEffect(() => {
    // Runs after every render
    console.log('Component mounted or updated');
    
    return () => {
      // Cleanup (runs before unmount or re-render)
      console.log('Cleanup');
    };
  }, [dependency]); // dependency array
}
```

Dependency array options:
- No array: runs after every render
- Empty array: runs only on mount and unmount
- With dependencies: runs when dependencies change

---

## 7. What is Props Drilling?
**Answer:**
Props drilling is passing data through many intermediate components that don't need it, just to pass it to a child component that does.

```jsx
// Props drilling - passing through multiple levels
<Component1 user={user} />
→ <Component2 user={user} />
→ <Component3 user={user} />
→ <Component4 user={user} /> // Finally uses it

// Solution: Use Context API or state management
```

---

## 8. What is the Virtual DOM?
**Answer:**
Virtual DOM is an in-memory representation of the actual DOM. React uses it to:
1. Update Virtual DOM first
2. Compare with previous Virtual DOM
3. Calculate differences (reconciliation)
4. Update only changed parts in actual DOM

Benefits: Improves performance, easier to work with

---

## 9. What is React Fragment?
**Answer:**
Fragment allows grouping multiple elements without adding extra DOM nodes.

```jsx
// Without Fragment - adds extra div
function Component() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}

// With Fragment - no extra node
function Component() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  );
}
```

---

## 10. What are Controlled vs Uncontrolled Components?
**Answer:**

**Controlled Component:** React state controls the input value
```jsx
function ControlledInput() {
  const [value, setValue] = useState('');
  
  return (
    <input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}
```

**Uncontrolled Component:** DOM controls the input value
```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);
  
  const handleSubmit = () => {
    console.log(inputRef.current.value);
  };
  
  return <input ref={inputRef} />;
}
```

---

## 11. What is Key prop and why is it important?
**Answer:**
Key helps React identify which items have changed. It should be unique and stable (not index in unstable lists).

```jsx
// Good - unique and stable
{items.map(item => <Item key={item.id} data={item} />)}

// Bad - uses index (can cause issues if list changes)
{items.map((item, index) => <Item key={index} data={item} />)}
```

Without proper keys, React may re-render wrong components.

---

## 12. What is useContext Hook?
**Answer:**
useContext allows consuming context values without prop drilling.

```jsx
import { createContext, useContext } from 'react';

const ThemeContext = createContext();

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Component />
    </ThemeContext.Provider>
  );
}

function Component() {
  const theme = useContext(ThemeContext);
  return <div>Current theme: {theme}</div>;
}
```

---

## 13. What is the difference between state and props?
**Answer:**

| Props | State |
|-------|-------|
| Passed from parent to child | Managed within component |
| Read-only (immutable) | Can be changed (mutable) |
| Used for static data | Used for dynamic data |
| Cannot be modified by child | Changed via setState/useState |

---

## 14. Explain the component lifecycle
**Answer:**
React components go through three phases:

1. **Mounting:** Component is being created and DOM is being inserted
   - constructor() → render() → componentDidMount()

2. **Updating:** Component is being re-rendered
   - componentDidUpdate()

3. **Unmounting:** Component is being removed
   - componentWillUnmount()

In functional components, useEffect handles all these phases.

---

## 15. What is conditional rendering?
**Answer:**
Rendering different UI based on conditions.

```jsx
function Component({ isLoggedIn }) {
  // If-else
  if (isLoggedIn) {
    return <Dashboard />;
  }
  return <Login />;
}

// Ternary operator
function Component({ isLoggedIn }) {
  return isLoggedIn ? <Dashboard /> : <Login />;
}

// Logical AND
function Component({ showAlert }) {
  return showAlert && <Alert />;
}
```

---

## 16. What is the useReducer Hook?
**Answer:**
useReducer is used for complex state logic. It's similar to Redux pattern.

```jsx
import { useReducer } from 'react';

function reducer(state, action) {
  switch(action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
}

function Counter() {
  const [count, dispatch] = useReducer(reducer, 0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
      <button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
    </div>
  );
}
```

---

## 17. What are Higher Order Components (HOC)?
**Answer:**
HOC is an advanced pattern for reusing component logic. It's a function that takes a component and returns an enhanced component.

```jsx
function withTheme(Component) {
  return function WrappedComponent(props) {
    const theme = 'dark';
    return <Component {...props} theme={theme} />;
  };
}

const ThemedButton = withTheme(Button);
```

---

## 18. What is Render Props Pattern?
**Answer:**
Render props is a technique for sharing code between components using a prop whose value is a function.

```jsx
function DataProvider({ render }) {
  const [data, setData] = useState([]);
  
  return render(data);
}

// Usage
<DataProvider render={(data) => (
  <div>{data.map(item => <p key={item}>{item}</p>)}</div>
)} />
```

---

## 19. What is the useCallback Hook?
**Answer:**
useCallback memoizes a function, returning the same function reference across renders if dependencies haven't changed.

```jsx
import { useCallback } from 'react';

function Parent() {
  const [count, setCount] = useState(0);
  
  const handleClick = useCallback(() => {
    setCount(count + 1);
  }, [count]); // Function recreated only if count changes
  
  return <Child onClick={handleClick} />;
}
```

---

## 20. What is the useMemo Hook?
**Answer:**
useMemo memoizes expensive computations and returns the same value across renders if dependencies haven't changed.

```jsx
import { useMemo } from 'react';

function Component({ items }) {
  const expensiveValue = useMemo(() => {
    return items.filter(item => item.active).length;
  }, [items]); // Recompute only if items change
  
  return <div>Active: {expensiveValue}</div>;
}
```

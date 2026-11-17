# State Management: React Context, Redux, Zustand, Recoil & MobX

## 1. React Context API

### Basic Context Setup

```javascript
// Create context
import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

### Usage

```javascript
function App() {
  return (
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );
}

function Dashboard() {
  const { user, loading, logout } = useUser();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Advanced: useReducer with Context

```javascript
const initialState = {
  user: null,
  loading: false,
  error: null,
  notifications: []
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload, loading: false };
    case 'LOGIN_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    default:
      return state;
  }
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

// Usage
function LoginForm() {
  const { state, dispatch } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await fetch('/api/auth/login', {...});
      const data = await response.json();
      dispatch({ type: 'LOGIN_SUCCESS', payload: data.user });
    } catch (error) {
      dispatch({ type: 'LOGIN_ERROR', payload: error.message });
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  );
}
```

---

## 2. Redux

### Redux Setup

```javascript
// reducers/userReducer.js
const initialState = {
  user: null,
  loading: false,
  error: null
};

export function userReducer(state = initialState, action) {
  switch (action.type) {
    case 'USER_FETCH_START':
      return { ...state, loading: true };
    case 'USER_FETCH_SUCCESS':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'USER_FETCH_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'USER_LOGOUT':
      return initialState;
    default:
      return state;
  }
}

// store.js
import { createStore, combineReducers } from 'redux';
import { userReducer } from './reducers/userReducer';

const rootReducer = combineReducers({
  user: userReducer
});

export const store = createStore(rootReducer);

// actions.js
export const fetchUser = (userId) => (dispatch) => {
  dispatch({ type: 'USER_FETCH_START' });
  
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => {
      dispatch({
        type: 'USER_FETCH_SUCCESS',
        payload: data
      });
    })
    .catch(error => {
      dispatch({
        type: 'USER_FETCH_ERROR',
        payload: error.message
      });
    });
};

export const logout = () => ({
  type: 'USER_LOGOUT'
});
```

### Redux with React

```javascript
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store, fetchUser, logout } from './store';

function App() {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
}

function Dashboard() {
  const { user, loading, error } = useSelector(state => state.user);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUser(1));
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => dispatch(logout())}>Logout</button>
    </div>
  );
}
```

### Redux DevTools Integration

```javascript
import { createStore, applyMiddleware, compose } from 'redux';

const composeEnhancers =
  (typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

export const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(thunk))
);
```

---

## 3. Zustand (Modern, Simple)

### Zustand Basic Setup

```javascript
import create from 'zustand';

// Create store
export const useStore = create((set) => ({
  user: null,
  loading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  logout: () => set({ user: null }),

  // Async action
  fetchUser: async (userId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      set({ user: data, loading: false, error: null });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  }
}));

// Usage in component
function Dashboard() {
  const { user, loading, error, fetchUser, logout } = useStore();

  useEffect(() => {
    fetchUser(1);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Zustand Selectors (Performance)

```javascript
// Selectors for specific slices
const selectUser = (state) => state.user;
const selectLoading = (state) => state.loading;
const selectIsAuthenticated = (state) => !!state.user;

function Dashboard() {
  // Only re-render when user changes
  const user = useStore(selectUser);
  
  // Only re-render when loading changes
  const loading = useStore(selectLoading);
  
  // ...
}

// Or with custom hook
export const useUserActions = () => {
  return useStore((state) => ({
    user: state.user,
    fetchUser: state.fetchUser,
    logout: state.logout
  }));
};

function Dashboard() {
  const { user, fetchUser, logout } = useUserActions();
  // ...
}
```

### Zustand Middleware

```javascript
import { devtools, persist } from 'zustand/middleware';

export const useStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
      }),
      { name: 'user-storage' } // localStorage key
    )
  )
);
```

---

## 4. Recoil (Facebook)

### Recoil Atoms

```javascript
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';

// Atoms
export const userAtom = atom({
  key: 'user',
  default: null
});

export const loadingAtom = atom({
  key: 'loading',
  default: false
});

export const errorAtom = atom({
  key: 'error',
  default: null
});

// Selectors (derived state)
export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const user = get(userAtom);
    return !!user;
  }
});

export const userEmailSelector = selector({
  key: 'userEmail',
  get: ({ get }) => {
    const user = get(userAtom);
    return user?.email || null;
  }
});

// Async selector
export const userDataSelector = selector({
  key: 'userData',
  get: async ({ get }) => {
    const userId = get(userIdAtom);
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }
});
```

### Using Recoil in Components

```javascript
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

function Dashboard() {
  // Get and set
  const [user, setUser] = useRecoilState(userAtom);
  
  // Only read
  const isAuthenticated = useRecoilValue(isAuthenticatedSelector);
  
  // Only write
  const setLoading = useSetRecoilState(loadingAtom);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {...});
      const data = await response.json();
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {isAuthenticated && <h1>Welcome, {user.name}</h1>}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

---

## 5. MobX (Reactive)

### MobX Setup

```javascript
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

class UserStore {
  user = null;
  loading = false;
  error = null;

  constructor() {
    makeAutoObservable(this); // Automatically makes properties observable
  }

  async fetchUser(userId) {
    this.loading = true;
    try {
      const response = await fetch(`/api/users/${userId}`);
      this.user = await response.json();
      this.error = null;
    } catch (error) {
      this.error = error.message;
    } finally {
      this.loading = false;
    }
  }

  logout() {
    this.user = null;
  }

  get isAuthenticated() {
    return !!this.user;
  }
}

export const userStore = new UserStore();

// Create context
const StoreContext = React.createContext();

export function StoreProvider({ children }) {
  return (
    <StoreContext.Provider value={{ userStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = React.useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return context.userStore;
}
```

### MobX Components (Observer)

```javascript
// Components automatically re-render when observed data changes
const Dashboard = observer(() => {
  const store = useStore();

  return (
    <div>
      {store.loading && <div>Loading...</div>}
      {store.error && <div>Error: {store.error}</div>}
      {store.isAuthenticated && (
        <div>
          <h1>{store.user.name}</h1>
          <button onClick={() => store.logout()}>Logout</button>
        </div>
      )}
    </div>
  );
});
```

---

## 6. Comparison

| Feature | Context | Redux | Zustand | Recoil | MobX |
|---------|---------|-------|---------|--------|------|
| **Complexity** | Low | High | Very Low | Medium | High |
| **Bundle Size** | ~0KB | ~40KB | ~2KB | ~30KB | ~16KB |
| **Learning Curve** | Easy | Steep | Very Easy | Medium | Steep |
| **DevTools** | None | Excellent | Good | Good | Good |
| **Performance** | ⚠️ Medium | ✅ High | ✅ High | ✅ High | ✅ High |
| **Async** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **React Hooks** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 7. When to Use Each

**Use Context API if:**
- Small app with simple state
- Learning React
- Don't need complex state logic

**Use Redux if:**
- Large app with complex state
- Need middleware for side effects
- Team already experienced with Redux

**Use Zustand if:**
- Want simplicity without Redux
- Prefer minimal boilerplate
- Building modern app

**Use Recoil if:**
- Facebook developer
- Need atomic state management
- Fine-grained reactivity

**Use MobX if:**
- Prefer reactive programming
- Coming from OOP background
- Automatic tracking of changes

---

## 8. Best Practices

```javascript
// ✅ DO:
1. Keep state normalized (flat structure)
2. Use selectors to derive state
3. Avoid deeply nested state
4. Use DevTools for debugging
5. Implement error boundaries
6. Memoize expensive computations
7. Use TypeScript for type safety
8. Keep async logic separate

// ❌ DON'T:
1. Put everything in state
2. Mutate state directly
3. Create selectors in render
4. Store derived data
5. Skip loading/error states
6. Couple components to store structure
7. Make state too granular
8. Ignore performance optimization
```

This comprehensive state management guide covers all major solutions with practical examples!

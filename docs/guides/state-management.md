# State Management Guide

This template uses **two complementary state management tools**:

| Tool | Purpose | When to use |
|---|---|---|
| **Redux Toolkit** | Global client state | UI state, auth, cart, settings |
| **TanStack Query** | Server state | API data, caching, loading/error |

**Rule of thumb:** If the data comes from a server, use TanStack Query. If it's purely client-side state, use Redux.

---

## Part 1: Redux Toolkit

### Store Setup

The Redux store is configured in `shared/store/index.ts`. Add new slices' reducers here:

```ts
// src/shared/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { counterReducer } from "@/features/example-counter/model/counterSlice";
import { userReducer } from "@/entities/user/model/userSlice";
// Import your new slice here:
// import { authReducer } from "@/features/auth/model/authSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    // auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Creating a Redux Slice

**Step 1:** Create the slice file in the appropriate layer:

```ts
// src/features/auth/model/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string }>) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.isLoading = false;
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;
```

**Step 2:** Register in the store:

```ts
// src/shared/store/index.ts
import { authReducer } from "@/features/auth/model/authSlice";

export const store = configureStore({
  reducer: {
    // ...existing reducers
    auth: authReducer,
  },
});
```

**Step 3:** Export from the feature's public API:

```ts
// src/features/auth/index.ts
export { authReducer, loginStart, loginSuccess, logout } from "./model/authSlice";
export { LoginForm } from "./ui/LoginForm";
```

### Using Redux in Components

Always use the **typed hooks** from `shared/hooks/`:

```tsx
"use client";

import { useAppDispatch, useAppSelector } from "@/shared/hooks";
import { increment, decrement } from "@/features/example-counter";

export function Counter() {
  // Typed dispatch — knows all action creators
  const dispatch = useAppDispatch();
  
  // Typed selector — knows the full state shape
  const count = useAppSelector((state) => state.counter.value);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => dispatch(decrement())}>-</button>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}
```

### Redux Async Actions with createAsyncThunk

For async operations that also update Redux state:

```ts
// src/features/auth/model/authSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient } from "@/shared/api";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/login", credentials);
      return data; // { token: string }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Login failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: { isAuthenticated: false, token: null, isLoading: false, error: null },
  reducers: {
    logout(state) { state.isAuthenticated = false; state.token = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.isLoading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload as string;
        state.isLoading = false;
      });
  },
});
```

### What State Goes in Redux?

✅ **Good candidates for Redux:**
- Authentication state (`isAuthenticated`, `token`, `currentUser`)
- Shopping cart (`items`, `total`)
- UI state that affects multiple components (`sidebarIsOpen`, `theme`, `notifications`)
- Multi-step form progress
- User preferences (language, display settings)

❌ **Don't put in Redux:**
- Server data (use TanStack Query instead)
- Local component state (use `useState` instead)
- Form values (use `react-hook-form` instead)
- Cached API responses (TanStack Query handles this)

---

## Part 2: TanStack Query

TanStack Query manages **server state** — data that lives on your server and needs to be fetched, cached, and kept in sync.

### QueryClient Setup

The `QueryClient` is created in `app/providers.tsx` with sensible defaults:

```tsx
// src/app/providers.tsx
const [queryClient] = useState(
  () => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,  // Data is fresh for 1 minute
        retry: 1,              // Retry failed requests once
      },
    },
  })
);
```

### Creating Query Hooks

Query hooks live in the `api/` folder of an entity or feature:

```ts
// src/entities/user/api/userApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { User } from "../model/types";

// Query key factory — ensures consistent cache keys
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  detail: (id: number) => [...userKeys.all, "detail", id] as const,
};

// Fetch a list of users
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<User[]>("/users");
      return data;
    },
  });
}

// Fetch a single user
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<User>(`/users/${id}`);
      return data;
    },
    enabled: !!id,  // Don't run if id is 0/null
  });
}

// Create a mutation (POST/PUT/DELETE)
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Omit<User, "id" | "createdAt">) => {
      const { data } = await apiClient.post<User>("/users", newUser);
      return data;
    },
    onSuccess: () => {
      // Invalidate the users list cache so it re-fetches
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

### Using Query Hooks in Components

```tsx
"use client";

import { useUsers, useCreateUser } from "@/entities/user";
import { UserCard } from "@/entities/user";

export function UsersList() {
  const { data: users, isLoading, error } = useUsers();
  const createUser = useCreateUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading users</div>;

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      <button
        onClick={() => createUser.mutate({ name: "New User", email: "new@example.com", role: "user" })}
        disabled={createUser.isPending}
      >
        {createUser.isPending ? "Creating..." : "Add User"}
      </button>
    </div>
  );
}
```

### Understanding Query Keys

Query keys are how TanStack Query identifies and caches data. Use the **key factory pattern**:

```ts
export const userKeys = {
  all: ["users"] as const,                          // ["users"]
  lists: () => [...userKeys.all, "list"] as const,  // ["users", "list"]
  detail: (id: number) => [...userKeys.all, "detail", id] as const, // ["users", "detail", 5]
};

// When you invalidate "all users", it also invalidates lists and details
queryClient.invalidateQueries({ queryKey: userKeys.all });
```

### Optimistic Updates

For a better UX, update the UI before the server responds:

```ts
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: User) => apiClient.put(`/users/${user.id}`, user),
    
    // Before the request: update the cache immediately
    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.detail(updatedUser.id) });
      const previousUser = queryClient.getQueryData(userKeys.detail(updatedUser.id));
      
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      
      return { previousUser }; // rollback context
    },
    
    // If it fails: rollback to previous value
    onError: (err, updatedUser, context) => {
      queryClient.setQueryData(
        userKeys.detail(updatedUser.id),
        context?.previousUser
      );
    },
    
    // After success or failure: re-fetch from server
    onSettled: (data, error, updatedUser) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(updatedUser.id) });
    },
  });
}
```

---

## Redux vs TanStack Query: Decision Guide

```
Is the data from the server?
├── YES → Use TanStack Query
│         useQuery() for fetching
│         useMutation() for creating/updating/deleting
│
└── NO → Is it shared across many components?
          ├── YES → Use Redux
          │         createSlice, useAppSelector, useAppDispatch
          │
          └── NO → Use local useState / useReducer
```

### Concrete Examples

| State | Tool | Why |
|---|---|---|
| List of products from API | TanStack Query | Server data, needs caching |
| Current user profile from API | TanStack Query | Server data |
| Is the sidebar open? | Redux | Pure UI, no server |
| Shopping cart items | Redux | Client-side, needs persistence |
| Auth token | Redux | Client-side, global |
| Form input values | useState | Local component state |
| Search results | TanStack Query | Server data |
| Selected tab | useState | Simple local state |
| Theme preference | Redux | Global, affects whole app |

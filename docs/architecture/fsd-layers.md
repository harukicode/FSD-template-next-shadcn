# FSD Layers Deep Dive

## Understanding Each Layer

### shared/

The `shared/` layer is the **foundation** — it contains everything that is reusable and has no business logic.

#### shared/ui/

This is your **design system**. All UI primitives live here.

In this template, we use [shadcn/ui](https://ui.shadcn.com/) — components you own (not a dependency). Run `npx shadcn add button` to add components that land in `shared/ui/`.

```
shared/ui/
  button.tsx    ← <Button variant="outline" size="sm" />
  card.tsx      ← <Card>, <CardHeader>, <CardContent>, etc.
  badge.tsx     ← <Badge variant="secondary" />
  input.tsx     ← (add with: npx shadcn add input)
  dialog.tsx    ← (add with: npx shadcn add dialog)
  index.ts      ← barrel export for all UI components
```

**Rule:** UI components in `shared/ui/` must have **zero business logic** and **zero data fetching**. They only accept props.

#### shared/store/

Redux `configureStore` setup and TypeScript type exports.

```ts
// shared/store/index.ts
export const store = configureStore({ reducer: { ... } });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Add new reducers here** when you create a new slice elsewhere.

#### shared/hooks/

Typed hooks and general-purpose hooks that have no business logic.

```ts
// shared/hooks/useAppDispatch.ts — typed dispatch
// shared/hooks/useAppSelector.ts — typed selector
// shared/hooks/useLocalStorage.ts — (add when needed)
// shared/hooks/useDebounce.ts    — (add when needed)
```

#### shared/api/

The axios instance with base URL and interceptors. All API calls in the app use this client.

```ts
// shared/api/client.ts
export const apiClient = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });
```

#### shared/lib/

Utility functions. The most important one: `cn()` for combining Tailwind classes.

```ts
import { cn } from "@/shared/lib/utils";
// cn("px-4", condition && "py-2", "text-sm") → "px-4 py-2 text-sm"
```

---

### entities/

Each entity represents a **business domain object**. Think of entities as the nouns of your application.

```
entities/
  user/
    model/
      types.ts       ← TypeScript interface
      userSlice.ts   ← Redux slice for user state
    api/
      userApi.ts     ← TanStack Query hooks
    ui/
      UserCard.tsx   ← How the entity looks
    index.ts         ← Public API
  product/           ← Another entity
  order/             ← Another entity
```

#### Entity types (model/types.ts)

Define the TypeScript shape of the entity:

```ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
}
```

#### Entity Redux slice (model/entitySlice.ts)

The slice handles **storing and updating** the entity's data (not "what the user is doing with it"):

```ts
// entities/user/model/userSlice.ts
const userSlice = createSlice({
  name: "user",
  initialState: { currentUser: null, isLoading: false },
  reducers: {
    setCurrentUser(state, action) { state.currentUser = action.payload; },
    clearUser(state) { state.currentUser = null; },
  },
});
```

**What belongs in entity slice vs feature slice?**
- `setCurrentUser`, `clearUser` → entity slice (basic CRUD)
- `loginUser`, `logoutUser` → feature slice (`features/auth/`) — this is an action

#### Entity API hooks (api/entityApi.ts)

TanStack Query hooks for fetching entity data:

```ts
// entities/user/api/userApi.ts
export function useUser(id: number) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => apiClient.get<User>(`/users/${id}`).then(r => r.data),
  });
}
```

#### Entity UI components (ui/EntityCard.tsx)

Presentational components that render the entity. They receive the entity as a prop — **no data fetching inside**:

```tsx
// entities/user/ui/UserCard.tsx
// ✅ Just displays — doesn't fetch
export function UserCard({ user }: { user: User }) {
  return <Card>...</Card>;
}
```

---

### features/

Features represent **things users can do** — actions and interactions.

```
features/
  auth/
    model/
      authSlice.ts       ← isAuthenticated, token, login/logout actions
    ui/
      LoginForm.tsx      ← Form + submit handler
      LogoutButton.tsx   ← Button + click handler
    index.ts
  add-to-cart/
    model/
      cartSlice.ts
    ui/
      AddToCartButton.tsx
    index.ts
  example-counter/       ← Simple example in this template
    model/
      counterSlice.ts
    ui/
      Counter.tsx
    index.ts
```

#### Feature Redux slice

The slice for the specific **action's state** — not the entity's state:

```ts
// features/auth/model/authSlice.ts
const authSlice = createSlice({
  name: "auth",
  initialState: { isAuthenticated: false, token: null, isLoading: false },
  reducers: {
    loginStart(state) { state.isLoading = true; },
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.isLoading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
    },
  },
});
```

#### Feature UI components

These are "smart" components — they contain business logic:

```tsx
// features/auth/ui/LoginForm.tsx
"use client";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector((s) => s.auth.isLoading);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());
    // API call, then dispatch loginSuccess or loginFailure
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### widgets/

Widgets are the **sections** of your UI — large self-contained blocks.

```
widgets/
  header/
    ui/
      Header.tsx   ← Navigation + user menu + search
    index.ts
  sidebar/
    model/
      sidebarSlice.ts
    ui/
      Sidebar.tsx
    index.ts
  product-grid/
    ui/
      ProductGrid.tsx  ← Fetches and displays products
    index.ts
```

Widgets **can** import from features and entities:

```tsx
// widgets/header/ui/Header.tsx
import { UserAvatar } from "@/entities/user";    // ← entity component
import { LogoutButton } from "@/features/auth";   // ← feature component
import { SearchBar } from "@/features/search";    // ← feature component

export function Header() {
  return (
    <header>
      <Logo />
      <SearchBar />      {/* Feature */}
      <UserAvatar />     {/* Entity */}
      <LogoutButton />   {/* Feature */}
    </header>
  );
}
```

---

### pages/

Pages are the **composition layer** — they assemble widgets into a full page view.

```
pages/
  home/
    ui/
      HomePage.tsx   ← Assembles Header + Hero + FeaturedProducts + Footer
    index.ts
  dashboard/
    ui/
      DashboardPage.tsx
    index.ts
```

Pages should be **thin** — mostly just layout and widget composition:

```tsx
// pages/dashboard/ui/DashboardPage.tsx
import { Header } from "@/widgets/header";
import { Sidebar } from "@/widgets/sidebar";
import { StatsCards } from "@/widgets/stats-cards";
import { RecentOrders } from "@/widgets/recent-orders";

export function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <StatsCards />
          <RecentOrders />
        </main>
      </div>
    </div>
  );
}
```

---

## The Public API Rule (index.ts)

Every slice **must** have an `index.ts` that defines what is publicly accessible.

**Why?** It gives you the ability to refactor internals without breaking other parts of the app. If you move `UserCard.tsx` to `ui/cards/UserCard.tsx`, nothing breaks outside — only the `index.ts` needs updating.

```ts
// entities/user/index.ts
export { UserCard } from "./ui/UserCard";          // UI
export { userReducer } from "./model/userSlice";   // Reducer (for store)
export { useUser, useUsers } from "./api/userApi"; // Hooks
export type { User } from "./model/types";          // Types
```

**Rule:** Never import from inside a slice directly:
```ts
// ❌ WRONG
import { UserCard } from "@/entities/user/ui/UserCard";

// ✅ CORRECT
import { UserCard } from "@/entities/user";
```

---

## Inter-Layer Import Rules

### ✅ Allowed
```ts
// pages can import from widgets
import { Header } from "@/widgets/header";

// widgets can import from features
import { LoginButton } from "@/features/auth";

// features can import from entities
import type { User } from "@/entities/user";

// entities can import from shared
import { apiClient } from "@/shared/api";
import { Button } from "@/shared/ui";
```

### ❌ Forbidden
```ts
// shared CANNOT import from entities (or any higher layer)
// shared/ui/button.tsx
import { User } from "@/entities/user";  // ❌

// entities CANNOT import from features
// entities/user/model/userSlice.ts
import { authReducer } from "@/features/auth";  // ❌

// features CANNOT import from widgets or pages
// features/auth/ui/LoginForm.tsx
import { Header } from "@/widgets/header";  // ❌
```

### Why these rules matter

Imagine you're a new developer. You need to change the `Counter` feature.

With FSD rules, you know for certain:
1. `Counter` can only import from `entities/` and `shared/`
2. Nothing in `shared/` or `entities/` knows about `Counter`
3. Only `widgets/` and `pages/` use `Counter`

Without FSD, you might have circular dependencies, and changing one file could break 10 other unrelated things.

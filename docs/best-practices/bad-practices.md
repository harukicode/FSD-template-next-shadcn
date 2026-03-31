# Bad Practices (and How to Fix Them)

Real-world anti-patterns you should avoid. Each example shows the problem and the fix.

---

## 1. Importing Across Layer Boundaries (The #1 FSD Mistake)

### The Problem

```ts
// ❌ BAD: shared/store/index.ts imports from features — FORBIDDEN
import { authReducer } from "@/features/auth/model/authSlice";
// shared cannot import from features — it's a higher layer!
```

Wait, but the store NEEDS the auth reducer! Here's the correct approach:

### The Fix

The store in `shared/` only orchestrates — it doesn't import from features. Instead:

```ts
// ✅ CORRECT: shared/store/index.ts imports reducers directly
// This is intentional — shared/store is the assembler
import { counterReducer } from "@/features/example-counter/model/counterSlice";
import { userReducer } from "@/entities/user/model/userSlice";
```

The rule is more subtle: `shared/store` is infrastructure, and importing slice reducers is the accepted pattern for assembling the store. The forbidden direction is `shared/ui`, `shared/lib`, `shared/api` importing business logic.

### The Real Violation Example

```ts
// ❌ BAD: shared/ui/ProfileButton.tsx — a shared component using business entities
// src/shared/ui/ProfileButton.tsx
import { useAppSelector } from "@/shared/hooks";
import type { User } from "@/entities/user"; // ← shared importing from entities!

export function ProfileButton() {
  const user = useAppSelector(s => s.user.currentUser); // ← business logic in shared/ui
  return <button>{user?.name ?? "Login"}</button>;
}
```

```tsx
// ✅ CORRECT: Move to entities or widgets layer
// src/entities/user/ui/UserProfileButton.tsx
import { useAppSelector } from "@/shared/hooks"; // ← entities can use shared
import type { User } from "../model/types";

export function UserProfileButton() {
  const user = useAppSelector(s => s.user.currentUser);
  return <button>{user?.name ?? "Login"}</button>;
}
```

---

## 2. God Component (One Component Does Everything)

### The Problem

A 400-line component that fetches data, manages state, has business logic, and renders complex UI.

```tsx
// ❌ BAD: ShopPage does EVERYTHING
export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(r => r.json()),
      fetch("/api/user/me").then(r => r.json()),
    ]).then(([products, user]) => {
      setProducts(products);
      setUser(user);
      setIsLoading(false);
    });
  }, []);

  const handleAddToCart = (product) => {
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      setCart(cart.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    // Analytics tracking
    fetch("/api/analytics", { method: "POST", body: JSON.stringify({ event: "add_to_cart", productId: product.id }) });
  };

  // ...200 more lines
}
```

### The Fix

Split by responsibility, using FSD layers:

```tsx
// ✅ GOOD: ShopPage is a thin composition
// src/views/shop/ui/ShopPage.tsx
import { Header } from "@/widgets/header";
import { ProductFilters } from "@/widgets/product-filters";
import { ProductGrid } from "@/widgets/product-grid";
import { CartSidebar } from "@/widgets/cart-sidebar";

export function ShopPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 gap-6 p-6">
        <ProductFilters />         {/* handles filter state */}
        <ProductGrid />            {/* fetches and displays products */}
        <CartSidebar />            {/* cart state and actions */}
      </main>
    </div>
  );
}
```

Each widget handles its own concern. Easy to test, easy to find, easy to change.

---

## 3. Fetching Data in Entity UI Components

### The Problem

Entity components should display data, not fetch it.

```tsx
// ❌ BAD: UserCard fetches its own data
export function UserCard({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <Skeleton />;
  return <Card>{user.name}</Card>;
}

// Problem: If you render 20 UserCards on a page, that's 20 API calls!
```

### The Fix

Fetch data at a higher level, pass it down as props:

```tsx
// ✅ GOOD: UserCard is purely presentational
export function UserCard({ user }: { user: User }) {
  return <Card>{user.name}</Card>;
}

// ✅ GOOD: Widget fetches once and passes to components
// src/widgets/user-list/ui/UserList.tsx
export function UserList() {
  const { data: users, isLoading } = useUsers(); // one API call

  if (isLoading) return <Skeleton />;

  return (
    <div>
      {users?.map(user => (
        <UserCard key={user.id} user={user} /> // pass data as props
      ))}
    </div>
  );
}
```

---

## 4. Storing Server Data in Redux

### The Problem

Redux is for client state. Using it to cache server data creates duplication and sync issues.

```ts
// ❌ BAD: Using Redux to cache products (TanStack Query does this better)
const productsSlice = createSlice({
  name: "products",
  initialState: { items: [], isLoading: false, error: null, lastFetched: null },
  reducers: {
    setProducts(state, action) { state.items = action.payload; },
    setLoading(state, action) { state.isLoading = action.payload; },
    // ...manual cache management
  },
});

// In component:
useEffect(() => {
  if (!lastFetched || Date.now() - lastFetched > 60000) { // manual staleness!
    dispatch(fetchProducts());
  }
}, []);
```

```ts
// ✅ GOOD: TanStack Query handles caching automatically
export function useProducts() {
  return useQuery({
    queryKey: productKeys.lists(),
    queryFn: () => apiClient.get<Product[]>("/products").then(r => r.data),
    staleTime: 60_000, // cache for 1 minute — automatically!
  });
}
```

TanStack Query gives you: automatic background refetching, deduplication of requests, cache invalidation, optimistic updates, and more — for free.

---

## 5. `any` Type Everywhere

### The Problem

Using `any` removes all type safety benefits.

```ts
// ❌ BAD: any defeats TypeScript's purpose
async function fetchUser(id: any): Promise<any> {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data;
}

// These all "work" at compile time but fail at runtime:
fetchUser("not-a-number");       // No error
fetchUser(undefined);             // No error
const user = await fetchUser(1);
console.log(user.nonExistentField); // No error — but undefined at runtime
```

### The Fix

```ts
// ✅ GOOD: Proper typing catches bugs at compile time
async function fetchUser(id: number): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

fetchUser("not-a-number");  // ✋ TypeScript Error: string is not assignable to number
```

---

## 6. Not Handling Errors in Mutations

### The Problem

Users click "Save" and nothing happens — no error feedback.

```tsx
// ❌ BAD: Silent failure
function SaveButton() {
  const savePost = useMutation({
    mutationFn: (data) => apiClient.post("/posts", data),
  });

  return (
    <Button onClick={() => savePost.mutate(formData)}>
      Save
    </Button>
  );
  // If it fails, user sees nothing. They click Save again. And again. Confusion.
}
```

### The Fix

```tsx
// ✅ GOOD: Clear feedback for all states
function SaveButton() {
  const savePost = useMutation({
    mutationFn: (data) => apiClient.post("/posts", data),
    onError: (error) => {
      // Show a toast, update UI — user knows something went wrong
    },
  });

  return (
    <div>
      <Button
        onClick={() => savePost.mutate(formData)}
        disabled={savePost.isPending}
      >
        {savePost.isPending ? "Saving..." : "Save"}
      </Button>
      {savePost.isError && (
        <p className="text-sm text-destructive">
          Failed to save. Please try again.
        </p>
      )}
      {savePost.isSuccess && (
        <p className="text-sm text-green-600">Saved successfully!</p>
      )}
    </div>
  );
}
```

---

## 7. Prop Drilling (Passing Props Through Many Layers)

### The Problem

Passing data through 3-4 component layers just to reach a deeply nested component.

```tsx
// ❌ BAD: currentUser is drilled through App → Layout → Sidebar → UserMenu → Avatar
function App() {
  const [currentUser] = useState(null);
  return <Layout currentUser={currentUser} />;
}
function Layout({ currentUser }) {
  return <Sidebar currentUser={currentUser} />;  // Layout doesn't use it
}
function Sidebar({ currentUser }) {
  return <UserMenu currentUser={currentUser} />;  // Sidebar doesn't use it
}
function UserMenu({ currentUser }) {
  return <Avatar user={currentUser} />;  // Finally used here
}
```

### The Fix

Use Redux for global state or React Context for localized shared state:

```tsx
// ✅ GOOD: Avatar reads from Redux directly
function Avatar() {
  const currentUser = useAppSelector(s => s.user.currentUser);
  // No props needed! Reads from global state directly
  return <img src={currentUser?.avatar} />;
}

// No prop drilling — every component reads what it needs from the store
function App() {
  return <Layout />;  // No props needed
}
```

---

## 8. Mutating Redux State Directly

### The Problem

Redux Toolkit uses Immer under the hood, so you can write mutating syntax. But some patterns can still cause bugs.

```ts
// ❌ BAD: Replacing the whole object reference in a way Immer can't detect
reducers: {
  setItems(state, action) {
    return { ...state, items: action.payload };  // OK but redundant
  },
  addItem(state, action) {
    state.items = [...state.items, action.payload];  // Replacing array reference — works but inconsistent
  },
}
```

```ts
// ✅ GOOD: Use Immer's mutation syntax consistently
reducers: {
  setItems(state, action) {
    state.items = action.payload;  // Immer handles immutability
  },
  addItem(state, action) {
    state.items.push(action.payload);  // Immer-safe push
  },
  removeItem(state, action) {
    state.items = state.items.filter(item => item.id !== action.payload);
  },
}
```

---

## 9. Over-Engineering a Simple Case

### The Problem

Not every piece of state needs Redux. Not every reusable piece of code needs to be in `shared/`.

```tsx
// ❌ BAD: Redux for a simple toggle
// Creating a full Redux slice for "isModalOpen" in a form
const modalSlice = createSlice({
  name: "contactFormModal",
  initialState: { isOpen: false },
  reducers: { open: s => { s.isOpen = true; }, close: s => { s.isOpen = false; } },
});
```

```tsx
// ✅ GOOD: useState for simple local state
function ContactPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // No Redux needed — this state is local to this page
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Contact Us</Button>
      {isModalOpen && <ContactModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
```

**Use Redux when the state is needed by multiple unrelated components. Use `useState` for local UI state.**

---

## 10. Not Using the Public API (Barrel Exports)

### The Problem

Importing internals creates tight coupling and breaks refactoring.

```ts
// ❌ BAD: Importing directly from internal files
import { UserCard } from "@/entities/user/ui/UserCard";
import { userReducer } from "@/entities/user/model/userSlice";
import type { User } from "@/entities/user/model/types";
```

If you ever move `UserCard.tsx` to `ui/cards/UserCard.tsx`, every file with this import breaks.

```ts
// ✅ GOOD: Always import from the public API (index.ts)
import { UserCard, userReducer, type User } from "@/entities/user";
```

Now you can freely refactor `entities/user/` internals — only `index.ts` needs updating, and nothing outside the slice breaks.

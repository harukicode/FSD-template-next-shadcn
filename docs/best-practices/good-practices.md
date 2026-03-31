# Good Practices

Real-world examples of doing things the right way in this architecture.

---

## 1. Export Only What's Needed (Public API)

Every slice has an `index.ts` that defines its public interface. Only export what other layers need.

**Why it matters:** When you refactor internals (rename a file, split a component), nothing outside the slice breaks.

```ts
// ✅ GOOD: entities/user/index.ts — deliberate public API
export { UserCard } from "./ui/UserCard";           // Used in widgets
export { userReducer } from "./model/userSlice";    // Used in store
export { useUser, useUsers } from "./api/userApi";  // Used in features/widgets
export type { User } from "./model/types";           // Used everywhere

// Internal — NOT exported:
// - setUserLoading (internal action)
// - useUserInternal (internal hook)
```

```ts
// ❌ BAD: importing internal paths
import { UserCard } from "@/entities/user/ui/UserCard";  // bypasses public API
```

---

## 2. Keep Components Focused: One Responsibility

Each component should do **one thing well**.

```tsx
// ✅ GOOD: ProductCard just displays a product
// src/entities/product/ui/ProductCard.tsx
interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: number) => void;  // optional callback — no business logic inside
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card>
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.price}$</p>
      {onAddToCart && (
        <Button onClick={() => onAddToCart(product.id)}>Add to Cart</Button>
      )}
    </Card>
  );
}
```

```tsx
// ❌ BAD: ProductCard doing too much — fetching, state management, business logic
export function ProductCard({ productId }: { productId: number }) {
  const { data: product } = useProduct(productId);  // ← fetching in entity component
  const dispatch = useAppDispatch();
  
  const handleAddToCart = async () => {
    dispatch(addToCart(product));  // ← business logic in display component
    await apiClient.post("/analytics/track", { event: "add_to_cart" }); // ← side effects
  };
  
  return <Card>...</Card>;
}
```

---

## 3. Use Typed Hooks for Redux

Always use `useAppDispatch` and `useAppSelector` from `shared/hooks/` — never the untyped versions.

```ts
// ✅ GOOD: Typed hooks
import { useAppDispatch, useAppSelector } from "@/shared/hooks";

const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.user.currentUser);
```

```ts
// ❌ BAD: Untyped hooks — no autocomplete, no type safety
import { useDispatch, useSelector } from "react-redux";

const dispatch = useDispatch();          // dispatch is typed as Dispatch<AnyAction>
const user = useSelector(state => state.user.currentUser);  // state is any
```

---

## 4. Co-locate Related Files in Slices

Keep everything related to a feature/entity in one place.

**Real-world scenario:** You're asked to add a "user bio" field.

```
// ✅ GOOD: All user-related files are in entities/user/
src/entities/user/
  model/
    types.ts       ← Add bio?: string here
    userSlice.ts   ← Add updateBio action here
  api/
    userApi.ts     ← Add useUpdateBio mutation here
  ui/
    UserCard.tsx   ← Display bio here
    UserBioForm.tsx ← New component here
  index.ts         ← Export UserBioForm here
```

```
// ❌ BAD: User files scattered everywhere
src/
  types/
    user.ts
  components/
    UserCard.tsx
  hooks/
    useUser.ts
  store/
    slices/
      userSlice.ts
  api/
    userEndpoints.ts
```

With the bad approach, adding "bio" requires touching 5+ different directories.

---

## 5. Use Query Key Factories

Centralize your query keys to avoid typos and enable precise cache invalidation.

```ts
// ✅ GOOD: Key factory
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Usage:
useQuery({ queryKey: productKeys.detail(5) });

// Invalidating all products (including all lists and details):
queryClient.invalidateQueries({ queryKey: productKeys.all });

// Invalidating only lists:
queryClient.invalidateQueries({ queryKey: productKeys.lists() });
```

```ts
// ❌ BAD: String literals — easy to make typos, hard to invalidate precisely
useQuery({ queryKey: ["product", id] });    // "product" — singular
useQuery({ queryKey: ["products", id] });   // "products" — plural — different cache!

// When you want to invalidate, you're not sure which key to use:
queryClient.invalidateQueries({ queryKey: ["product"] });   // doesn't invalidate "products"
```

---

## 6. Handle Loading and Error States

Always handle all three states: loading, error, success.

```tsx
// ✅ GOOD: All states handled with good UX
export function ProductsList() {
  const { data: products, isLoading, isError, error } = useProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Failed to load products: {(error as Error).message}
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!products?.length) {
    return <p className="text-muted-foreground">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 7. Use TypeScript for Everything

Let TypeScript catch errors before they reach production.

```ts
// ✅ GOOD: Explicit types everywhere
interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// TypeScript catches bugs:
calculateTotal([{ productId: 1, quantity: "2", price: 10 }]);
//                                        ^^^  Error! Type 'string' is not assignable to type 'number'
```

```ts
// ❌ BAD: Using any — defeats the purpose of TypeScript
function calculateTotal(items: any[]): any {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Runtime error: NaN if quantity is a string — no TypeScript warning
}
```

---

## 8. Separate Server and Client Components

Use React Server Components (RSC) for data-heavy, non-interactive pages:

```tsx
// ✅ GOOD: BlogPage is a Server Component — fast, SEO-friendly
// src/views/blog/ui/BlogPage.tsx (no "use client")
export async function BlogPage() {
  // Runs on server — direct DB call, no API roundtrip
  const posts = await getPosts();

  return (
    <div>
      <PostsList posts={posts} />  {/* Server Component — pure display */}
      <CreatePostButton />          {/* Client Component — has onClick */}
    </div>
  );
}

// src/views/blog/ui/CreatePostButton.tsx
"use client";  // Only this small component is a Client Component
export function CreatePostButton() {
  const [isOpen, setIsOpen] = useState(false);
  return <Button onClick={() => setIsOpen(true)}>New Post</Button>;
}
```

---

## 9. Use `cn()` for Conditional Classes

Never concatenate Tailwind classes with string interpolation.

```tsx
// ✅ GOOD: cn() properly merges and deduplicates classes
import { cn } from "@/shared/lib/utils";

<div className={cn(
  "rounded-lg border p-4",
  isActive && "border-primary bg-primary/10",
  isDisabled && "opacity-50 cursor-not-allowed",
  className  // allow override via props
)}>
```

```tsx
// ❌ BAD: String concatenation causes conflicts and is hard to read
<div className={`rounded-lg border p-4 ${isActive ? "border-primary bg-primary/10" : ""} ${isDisabled ? "opacity-50" : ""}`}>
```

---

## 10. Use `createAsyncThunk` for Complex Async Logic

When async operations need Redux state updates (loading/error tracking), use `createAsyncThunk`:

```ts
// ✅ GOOD: createAsyncThunk manages loading/error automatically
export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials: LoginDto, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/auth/login", credentials);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message ?? "Login failed");
    }
  }
);

// extraReducers handle pending/fulfilled/rejected automatically
```

```tsx
// Usage:
const dispatch = useAppDispatch();
dispatch(loginUser({ email, password }));

// Component reads state:
const isLoading = useAppSelector(s => s.auth.isLoading);
const error = useAppSelector(s => s.auth.error);
```

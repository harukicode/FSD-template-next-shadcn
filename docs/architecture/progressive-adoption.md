# Progressive Adoption Guide

One of the best things about FSD is that **you don't have to use all layers from day one**.

This guide shows you how to grow your architecture gradually — starting minimal and adding complexity only when you need it.

---

## Stage 1: Minimal Setup (Days 1–7)

You just started a new project. You have a few pages and a handful of components. **Don't over-engineer.** At this stage you only need 2 layers:

```
src/
  app/
    layout.tsx
    page.tsx
    providers.tsx
    globals.css
  shared/
    ui/           ← All your reusable components
      button.tsx
      card.tsx
      input.tsx
      index.ts
    lib/
      utils.ts    ← cn(), formatDate(), etc.
    api/
      client.ts   ← axios instance
    store/
      index.ts    ← Redux store (even if mostly empty)
```

**Signs you're ready for Stage 1:**
- You just created the project
- You have < 5 screens
- The team is just you (or 2 people)

**What to do:**
- Put all page-level components directly in `app/`
- Put ALL reusable UI components in `shared/ui/`
- Don't create entities or features yet — you don't know your domain well enough

```tsx
// src/app/page.tsx — Stage 1: just write it here
export default function HomePage() {
  return (
    <main>
      <h1>Hello World</h1>
      {/* Just build the feature inline at first */}
    </main>
  );
}
```

---

## Stage 2: Add Entities (Week 2–3)

Your data model is becoming clear. You know you have `User`, `Product`, `Order` — things your business talks about. Now extract them.

```
src/
  app/
  shared/
  entities/        ← NEW
    user/
      model/
        types.ts       ← User interface
        userSlice.ts   ← User Redux state (auth, profile)
      api/
        userApi.ts     ← TanStack Query hooks for users
      ui/
        UserCard.tsx   ← How a user looks
      index.ts
```

**Signs you're ready for Stage 2:**
- You keep copy-pasting `User` type between files
- You have multiple places that fetch the same data
- The same "user card" or "product card" appears in multiple places

**Migration example:**

Before (everything inline):
```tsx
// src/app/users/page.tsx
interface User { id: number; name: string; email: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(setUsers);
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id} className="card">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
        </div>
      ))}
    </div>
  );
}
```

After (with entities layer):
```tsx
// src/entities/user/model/types.ts
export interface User { id: number; name: string; email: string; }

// src/entities/user/api/userApi.ts
export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => apiClient.get("/users") });
}

// src/entities/user/ui/UserCard.tsx
export function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <p>{user.name}</p>
      <p>{user.email}</p>
    </Card>
  );
}

// src/app/users/page.tsx — now super clean
import { UserCard } from "@/entities/user";
import { useUsers } from "@/entities/user";

export default function UsersPage() {
  const { data: users } = useUsers();
  return <div>{users?.map(u => <UserCard key={u.id} user={u} />)}</div>;
}
```

---

## Stage 3: Add Features (Week 3–5)

You now have user interactions that are getting complex. Things like "add to cart", "submit a review", "log in / log out". Extract them as features.

```
src/
  app/
  shared/
  entities/
  features/        ← NEW
    auth/
      model/
        authSlice.ts
      ui/
        LoginForm.tsx
        LogoutButton.tsx
      index.ts
    add-to-cart/
      model/
        addToCartSlice.ts
      ui/
        AddToCartButton.tsx
      index.ts
```

**Signs you're ready for Stage 3:**
- You have "do X" interactions scattered across page files
- Your page components are becoming huge (200+ lines of logic)
- Multiple pages need the same interaction (e.g., "add to cart" appears on product list AND product detail)

**Migration example:**

Before (login logic inline in page):
```tsx
// src/app/login/page.tsx — 150 lines of mixed UI + logic
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", { ... });
      const data = await res.json();
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch {
      setError("Invalid credentials");
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

After (with features layer):
```tsx
// src/features/auth/model/authSlice.ts
// src/features/auth/ui/LoginForm.tsx  ← all the logic lives here

// src/app/login/page.tsx — now just 5 lines
import { LoginForm } from "@/features/auth";
export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <LoginForm />
    </main>
  );
}
```

---

## Stage 4: Add Widgets (Month 2+)

Your pages are getting complex. You have a `Header` that appears on 10 pages and has its own logic (search, user menu, notifications). You have a `Sidebar` that tracks which section is active. These are **widgets**.

```
src/
  app/
  shared/
  entities/
  features/
  widgets/         ← NEW
    header/
      ui/
        Header.tsx       ← Imports from features and entities
      index.ts
    sidebar/
      model/
        sidebarSlice.ts  ← Is sidebar open/closed?
      ui/
        Sidebar.tsx
      index.ts
    product-grid/
      ui/
        ProductGrid.tsx
      index.ts
```

**Signs you're ready for Stage 4:**
- You're copy-pasting the same `<Header />` implementation into multiple page files
- Complex sections have their own internal state
- A page layout section contains multiple features and entities working together

---

## Stage 5: Add Pages Layer (Month 2+)

Your `app/` directory is getting cluttered with page logic. Extract full page compositions into the `pages/` layer.

```
src/
  app/
    page.tsx              ← Thin: just imports from pages/
    dashboard/
      page.tsx            ← Thin: just imports from pages/
  pages/                  ← NEW
    home/
      ui/
        HomePage.tsx      ← Full page composition
      index.ts
    dashboard/
      ui/
        DashboardPage.tsx
      index.ts
```

**Signs you're ready for Stage 5:**
- Next.js `app/` route files contain more than ~30 lines
- You want to test page compositions in isolation (without Next.js routing)

---

## Summary: When to Add Each Layer

| Layer | Add when... |
|---|---|
| `shared/` | From day 1 — always needed |
| `entities/` | You have repeating data types and display components |
| `features/` | You have complex user interactions (forms, mutations) |
| `widgets/` | Sections like Header/Sidebar need their own logic |
| `pages/` | Next.js route files are getting too large |

---

## Anti-Pattern: Adding All Layers Too Early

**Don't** create all 6 layers at project start if you don't need them.

```
// ❌ WRONG: Over-engineering a simple todo app from day 1
src/
  features/
    create-todo/       ← 3 files for just a text input + button
  entities/
    todo/              ← For 1 item type
  widgets/
    todo-list-section/ ← This is just a <ul>
```

```
// ✅ CORRECT: Start simple, add layers when you feel the pain
src/
  app/
    page.tsx           ← Inline TodoList for week 1
  shared/
    ui/                ← Button, Input
```

**The rule:** Add a layer when **NOT having it is causing pain** (copy-pasting, hard to find things, hard to test).

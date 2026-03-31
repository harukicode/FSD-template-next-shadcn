# Architecture Overview

This project uses **Feature-Sliced Design (FSD)** — a front-end architectural methodology that helps you build scalable, maintainable applications.

## What is FSD?

FSD is an architectural methodology specifically designed for front-end applications. It gives you:
- **Clear rules** on where to put code
- **Explicit import boundaries** (lower layers cannot import from higher layers)
- **Predictable scaling** — adding a new feature never breaks existing code

Official website: [feature-sliced.design](https://feature-sliced.design)

---

## The 6 Layers

FSD organizes code into 6 strictly ordered layers. **Higher layers can only import from lower layers.**

```
┌─────────────────────────────────┐
│            app (highest)        │  Global setup: providers, routes
├─────────────────────────────────┤
│         views (FSD: pages)      │  Full page compositions
├─────────────────────────────────┤
│            widgets              │  Complex reusable UI sections
├─────────────────────────────────┤
│            features             │  User interactions & business actions
├─────────────────────────────────┤
│            entities             │  Business domain objects
├─────────────────────────────────┤
│            shared (lowest)      │  Infrastructure: UI kit, API, utils
└─────────────────────────────────┘
```

**Import rule:** `app` → `pages` → `widgets` → `features` → `entities` → `shared`

Each layer can import from any layer **below** it, but **never** from a layer above.

---

## Layer Descriptions

### `shared/` — Infrastructure & Utilities

The foundation of the entire application. Contains things that have **no business logic** and can be reused anywhere.

What belongs here:
- **UI primitives** — buttons, inputs, modals (shadcn/ui components go here)
- **API client** — axios instance with interceptors
- **Utilities** — `cn()`, date formatting, validators
- **Store setup** — Redux `configureStore`, typed `useAppSelector`/`useAppDispatch`
- **Types** — generic TypeScript types (`ID`, `ApiResponse<T>`)
- **Configs** — environment variables, constants

What does NOT belong here:
- Business logic
- Feature-specific state
- Domain-specific API calls

### `entities/` — Business Domain Objects

Represents the **core objects of your business domain**: User, Product, Order, Article, etc.

What belongs here:
- **TypeScript types** for the entity
- **Redux slice** for entity state (CRUD state, not feature-specific state)
- **API hooks** for fetching entity data (TanStack Query)
- **UI components** that display the entity (`UserCard`, `ProductPreview`)

The key insight: an entity is something your **business talks about** ("We have Users, Products, Orders...").

### `features/` — User Interactions

Represents **actions a user can perform**: Login, Add to Cart, Submit Review, Toggle Dark Mode.

What belongs here:
- The Redux slice or mutation for the action
- The UI component(s) for the interaction
- Any local state specific to this action

The key insight: a feature is something a **user does** ("The user can log in, add items to cart...").

### `widgets/` — Independent UI Sections

Large, self-contained UI blocks that compose features and entities together.

Examples: `Header`, `Sidebar`, `ProductGrid`, `UserProfile`

What makes something a widget (not a feature):
- It's a **section of the page**, not a specific action
- It combines multiple features and entities
- It can be reused on multiple pages

### `views/` — Page Compositions (FSD pages layer)

Each page is a **composition of widgets** for a specific route. Pages should be thin — they don't contain logic, just arrange widgets.

> **Note on naming:** The FSD specification names this layer `pages/`. In this template we use `views/` to avoid a naming conflict with Next.js's `src/pages/` directory (which Next.js treats as the legacy Pages Router). The behavior is identical — it's just a rename.

### `app/` — Global Setup (Next.js App Router)

Global providers, styles, and the routing layer itself. In Next.js, this maps to the `app/` directory.

---

## Slice Structure

Every layer (except `shared`) is divided into **slices** — isolated units for a specific domain or feature.

Each slice follows this internal structure:

```
feature-name/
  model/         ← State, types, business logic
  ui/            ← React components
  api/           ← API calls (optional)
  lib/           ← Helpers specific to this slice (optional)
  index.ts       ← Public API — the ONLY way to import from this slice
```

### The `index.ts` Public API Rule

**Never import directly into a slice's internals from another slice.**

```ts
// ✅ CORRECT — import via public API
import { UserCard } from "@/entities/user";

// ❌ WRONG — importing internals directly
import { UserCard } from "@/entities/user/ui/UserCard";
```

The `index.ts` is the **contract** of the slice. It decides what is public and what is internal.

---

## How This Maps to Next.js

Next.js App Router uses the `app/` directory for routing. In this template:

```
src/
  app/               ← Next.js routing (= FSD app layer)
    layout.tsx       ← Root layout: fonts, metadata, Providers
    page.tsx         ← Route entry point (imports from src/views/)
    providers.tsx    ← All app-level providers (Redux, QueryClient)
  
  views/             ← FSD pages layer (full page compositions)
    home/
      ui/
        HomePage.tsx
      index.ts
  
  widgets/           ← Complex independent sections
  features/          ← User actions
  entities/          ← Business objects
  shared/            ← Infrastructure
```

**Convention:** Next.js `app/page.tsx` is thin — it just imports and renders the corresponding FSD page component:

```tsx
// src/app/page.tsx (Next.js route)
import { HomePage } from "@/views/home";
export default function Page() {
  return <HomePage />;
}
```

---

## Import Path Conventions

This project uses TypeScript path aliases configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

So all imports look like:
```ts
import { Button } from "@/shared/ui";
import { UserCard } from "@/entities/user";
import { Counter } from "@/features/example-counter";
import { Header } from "@/widgets/header";
import { HomePage } from "@/views/home";
```

---

## Quick Reference

| You want to add... | It goes in... |
|---|---|
| A reusable button component | `shared/ui/` |
| An API client configuration | `shared/api/` |
| A TypeScript type for `User` | `entities/user/model/types.ts` |
| A Redux slice for `User` state | `entities/user/model/userSlice.ts` |
| An API hook to fetch users | `entities/user/api/userApi.ts` |
| A login form + action | `features/auth/` |
| An "add to cart" button + logic | `features/add-to-cart/` |
| A page header with nav | `widgets/header/` |
| The full dashboard page UI | `views/dashboard/` |
| App-level themes/providers | `app/providers.tsx` |

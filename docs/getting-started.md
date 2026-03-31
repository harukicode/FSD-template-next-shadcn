# Getting Started

This guide walks you through setting up and running this FSD template from scratch.

---

## Prerequisites

Make sure you have the following installed:

- **Node.js** 18.17+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** 9+ (comes with Node.js)

Check your versions:
```bash
node --version   # should be 18.17+
npm --version    # should be 9+
```

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/harukicode/FSD-template-next-shadcn.git
cd FSD-template-next-shadcn
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

> If you don't have a backend, the template works without the API URL — just mock API calls return.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

---

## Directory Structure

```
FSD-template-next-shadcn/
├── src/
│   ├── app/                    # Next.js App Router + FSD app layer
│   │   ├── layout.tsx          # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx            # Home route entry point
│   │   ├── providers.tsx       # All app providers (Redux, QueryClient)
│   │   └── globals.css         # Global styles + CSS variables
│   │
│   ├── pages/                  # FSD: Page compositions
│   │   └── home/
│   │       ├── ui/HomePage.tsx
│   │       └── index.ts
│   │
│   ├── widgets/                # FSD: Complex UI sections
│   │   ├── header/
│   │   │   ├── ui/Header.tsx
│   │   │   └── index.ts
│   │   └── footer/             # (empty, add your footer here)
│   │
│   ├── features/               # FSD: User interactions
│   │   ├── example-counter/    # Redux counter example
│   │   │   ├── model/counterSlice.ts
│   │   │   ├── ui/Counter.tsx
│   │   │   └── index.ts
│   │   └── auth/               # (empty, implement authentication here)
│   │
│   ├── entities/               # FSD: Business domain objects
│   │   ├── user/
│   │   │   ├── model/types.ts
│   │   │   ├── model/userSlice.ts
│   │   │   ├── api/userApi.ts
│   │   │   ├── ui/UserCard.tsx
│   │   │   └── index.ts
│   │   └── product/            # (empty, add product entity here)
│   │
│   └── shared/                 # FSD: Infrastructure & utilities
│       ├── api/client.ts       # Axios instance
│       ├── config/index.ts     # App configuration
│       ├── hooks/              # useAppDispatch, useAppSelector
│       ├── lib/utils.ts        # cn() and other utilities
│       ├── store/index.ts      # Redux store
│       ├── types/index.ts      # Generic TypeScript types
│       └── ui/                 # shadcn/ui components
│           ├── button.tsx
│           ├── card.tsx
│           ├── badge.tsx
│           └── index.ts
│
├── docs/                       # Architecture documentation
│   ├── architecture/           # FSD overview and layer guides
│   ├── guides/                 # How-to guides
│   └── best-practices/         # Good & bad practices with examples
│
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Adding shadcn/ui Components

The template comes with `Button`, `Card`, and `Badge` pre-configured. To add more:

```bash
npx shadcn add input
npx shadcn add dialog
npx shadcn add dropdown-menu
npx shadcn add toast
```

Components are added to `src/shared/ui/` and exported from `src/shared/ui/index.ts`.

After adding, update the barrel export:
```ts
// src/shared/ui/index.ts
export { Button } from "./button";
export { Card, CardHeader, ... } from "./card";
export { Input } from "./input";      // ← add new components here
export { Dialog, ... } from "./dialog";
```

---

## Adding a New Feature

Follow the step-by-step guide in [docs/guides/adding-feature.md](../guides/adding-feature.md).

Quick overview:
1. **Entity** → `src/entities/[name]/` — types, state, API hooks, display component
2. **Feature** → `src/features/[name]/` — interaction logic and UI
3. **Register** reducer in `src/shared/store/index.ts`
4. **Widget** (optional) → `src/widgets/[name]/` if it's a page section
5. **Page** → add to `src/views/[route]/` and wire to `src/app/[route]/page.tsx`

---

## Key Concepts

### Import Paths

All imports use the `@/` alias which points to `src/`:

```ts
import { Button } from "@/shared/ui";
import { UserCard } from "@/entities/user";
import { Counter } from "@/features/example-counter";
```

### Layer Import Rules

Higher layers can import from lower layers, never the other way:

```
app → pages → widgets → features → entities → shared
```

### State Management

- **Redux Toolkit** — for client state (auth, cart, UI state)
- **TanStack Query** — for server state (API data, caching)
- **useState** — for local component state

See [docs/guides/state-management.md](../guides/state-management.md) for details.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture Overview](../architecture/overview.md) | FSD concepts and layer structure |
| [FSD Layers Deep Dive](../architecture/fsd-layers.md) | Detailed guide for each layer |
| [Progressive Adoption](../architecture/progressive-adoption.md) | How to grow the architecture gradually |
| [State Management](../guides/state-management.md) | Redux + TanStack Query guide |
| [Adding a Feature](../guides/adding-feature.md) | Step-by-step feature creation |
| [Working with API](../guides/working-with-api.md) | API calls, TanStack Query patterns |
| [Good Practices](../best-practices/good-practices.md) | Patterns to follow |
| [Bad Practices](../best-practices/bad-practices.md) | Anti-patterns to avoid |
| [Business Logic](../best-practices/business-logic.md) | How to identify and organize business logic |

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16+ | React framework with App Router |
| [React](https://react.dev) | 19+ | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5+ | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | 4+ | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com) | latest | UI components |
| [Redux Toolkit](https://redux-toolkit.js.org) | latest | Client state management |
| [TanStack Query](https://tanstack.com/query) | v5 | Server state management |
| [Lucide React](https://lucide.dev) | latest | Icon library |
| [Axios](https://axios-http.com) | latest | HTTP client |

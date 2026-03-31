# FSD Template — Next.js + Redux + TanStack Query + shadcn/ui

A production-ready Next.js template following **Feature-Sliced Design (FSD)** architecture, with TypeScript, Redux Toolkit, TanStack Query, shadcn/ui, and Lucide icons.

---

## Quick Start

```bash
git clone https://github.com/harukicode/FSD-template-next-shadcn.git
cd FSD-template-next-shadcn
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16+** | React framework, App Router, RSC |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | UI component system (you own the code) |
| **Redux Toolkit** | Global client state (auth, cart, UI) |
| **TanStack Query v5** | Server state, caching, data fetching |
| **Lucide React** | Icon library |
| **Axios** | HTTP client |

---

## Architecture

This template uses [Feature-Sliced Design](https://feature-sliced.design) — a front-end architectural methodology.

```
src/
├── app/          # Next.js routing + app providers
├── views/        # Full page compositions
├── widgets/      # Complex independent UI sections
├── features/     # User interactions (login, add-to-cart, etc.)
├── entities/     # Business objects (User, Product, Order)
└── shared/       # Infrastructure (UI kit, API, store, utils)
```

**Import rule:** higher layers can import from lower layers, never the other way.

`app → views → widgets → features → entities → shared`

---

## What's Included

- **Redux store** configured with typed `useAppSelector` and `useAppDispatch` hooks
- **TanStack QueryClient** with sensible defaults (staleTime, retry)
- **Axios client** with request/response interceptors
- **shadcn/ui** components: Button, Card, Badge (add more with `npx shadcn add`)
- **Example feature**: Redux counter demonstrating the features layer
- **Example entity**: User with types, Redux slice, TanStack Query hooks, and display component
- **Header widget**: Responsive header with navigation
- **CSS variables**: Full dark mode support out of the box
- **Comprehensive documentation**: Architecture guides, best practices, real-world examples

---

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/getting-started.md) | Setup, structure, scripts |
| [Architecture Overview](docs/architecture/overview.md) | FSD concepts and layers |
| [FSD Layers Deep Dive](docs/architecture/fsd-layers.md) | Each layer explained with examples |
| [Progressive Adoption](docs/architecture/progressive-adoption.md) | Grow the architecture gradually |
| [State Management](docs/guides/state-management.md) | Redux Toolkit + TanStack Query |
| [Adding a Feature](docs/guides/adding-feature.md) | Step-by-step: create a full feature |
| [Working with API](docs/guides/working-with-api.md) | API calls, mutations, error handling |
| [Good Practices](docs/best-practices/good-practices.md) | Patterns to follow with real examples |
| [Bad Practices](docs/best-practices/bad-practices.md) | Anti-patterns to avoid |
| [Business Logic](docs/best-practices/business-logic.md) | What is business logic and where it goes |

---

## Adding shadcn/ui Components

```bash
npx shadcn add input
npx shadcn add dialog
npx shadcn add dropdown-menu
```

Components land in `src/shared/ui/` — don't forget to re-export from `src/shared/ui/index.ts`.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout: fonts, Providers
│   ├── page.tsx            # Home route → imports from views/home
│   ├── providers.tsx       # Redux + QueryClient providers
│   └── globals.css         # Tailwind + CSS variables
│
├── views/home/             # FSD: page compositions
├── widgets/header/         # FSD: complex UI sections
├── features/
│   └── example-counter/    # Redux slice + interactive UI
├── entities/
│   └── user/               # User type, slice, hooks, card
└── shared/
    ├── api/                # Axios client
    ├── config/             # App configuration
    ├── hooks/              # useAppDispatch, useAppSelector
    ├── lib/                # cn() utility
    ├── store/              # Redux store
    ├── types/              # Generic TS types
    └── ui/                 # Button, Card, Badge
```

---

## License

MIT

# FSD Template — Next.js + shadcn/ui

Clean, empty Next.js starter following **Feature-Sliced Design (FSD)** architecture.
TypeScript · Tailwind CSS v4 · Redux Toolkit · TanStack Query · shadcn/ui · Axios

---

## Quick Start

```bash
git clone https://github.com/harukicode/FSD-template-next-shadcn.git
cd FSD-template-next-shadcn
npm install
cp .env.example .env.local
npm run dev
```

---

## Tech Stack

| | |
|---|---|
| **Next.js 16+** | App Router, RSC |
| **TypeScript** | Strict mode |
| **Tailwind CSS v4** | + CSS variables, dark mode ready |
| **shadcn/ui** | Component system (`src/shared/ui/`) |
| **Redux Toolkit** | Global client state |
| **TanStack Query v5** | Server state & caching |
| **Axios** | HTTP client |

---

## Architecture

```
src/
├── app/          # Next.js App Router — routing, providers, global styles
├── views/        # Page compositions (one per route)
├── widgets/      # Complex independent UI sections
├── features/     # User interactions & business operations
├── entities/     # Business domain objects (types, display components)
└── shared/       # Infrastructure: UI kit, API client, store, utils
```

**Import rule — higher layers import from lower, never the reverse:**

```
app → views → widgets → features → entities → shared
```

Each layer has a `README.md` explaining its rules and code templates.

---

## Adding shadcn/ui Components

```bash
npx shadcn add input
npx shadcn add dialog
npx shadcn add dropdown-menu
```

Components land in `src/shared/ui/` — re-export from `src/shared/ui/index.ts`.

---

## Documentation

| | |
|---|---|
| [src/shared/README.md](src/shared/README.md) | API client, store, hooks, utilities |
| [src/entities/README.md](src/entities/README.md) | Business objects — structure & templates |
| [src/features/README.md](src/features/README.md) | User interactions — structure & templates |
| [src/widgets/README.md](src/widgets/README.md) | Complex UI sections |
| [src/views/README.md](src/views/README.md) | Page compositions |
| [docs/](docs/) | Architecture guides & best practices |

---

## License

MIT

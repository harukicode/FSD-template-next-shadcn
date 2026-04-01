# entities/

Business domain objects — the core data of your app: `User`, `Product`, `Order`, `Post`.
Entities define **what** something is, not what you can do with it.

**Can import from:** `shared` only
**Cannot import from:** `features`, `widgets`, `views`, `app`

---

## Folder structure

```
entities/
└── entity-name/
    ├── index.ts          ← public API
    ├── model/
    │   ├── types.ts      ← TypeScript interfaces (primary artifact)
    │   └── slice.ts      ← Redux slice (only if entity has global state)
    ├── api/
    │   └── queries.ts    ← TanStack Query hooks (read operations)
    └── ui/
        └── EntityCard.tsx  ← Display-only component, no business logic
```

---

## Template: entity type

```ts
// entities/entity-name/model/types.ts
export interface EntityName {
  id: string;
  // ... fields
  createdAt: string;
}
```

## Template: TanStack Query read hooks

```ts
// entities/entity-name/api/queries.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";
import type { EntityName } from "../model/types";

const keys = {
  all: ["entity-name"] as const,
  byId: (id: string) => ["entity-name", id] as const,
};

export function useEntityName(id: string) {
  return useQuery({
    queryKey: keys.byId(id),
    queryFn: () =>
      apiClient.get<EntityName>(`/entity-name/${id}`).then((r) => r.data),
  });
}
```

## Template: public API

```ts
// entities/entity-name/index.ts
export type { EntityName } from "./model/types";
export { EntityCard } from "./ui/EntityCard";
export { useEntityName } from "./api/queries";
```

---

## Rules

- Entity UI components are **display-only** — no buttons that trigger business operations
- Business operations (delete, update) belong in `features/`, not here
- Keep entities thin — no complex business logic

# shared/

Infrastructure and cross-cutting utilities. Everything here is project-agnostic and reusable.

**Cannot import from any other layer.**
If something in `shared/` needs to import from `entities/` or above — it doesn't belong here.

---

## Sublayers

### `shared/ui/` — UI components
shadcn/ui components live here. Add more with `npx shadcn add <component>`.
After adding, re-export from `shared/ui/index.ts`.

```ts
// shared/ui/index.ts
export { Button } from "./button";
export { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
// add new components here
```

### `shared/api/` — HTTP client
Axios instance with base URL and interceptors.

```ts
import { apiClient } from "@/shared/api";

// GET
const data = await apiClient.get("/endpoint").then(r => r.data);

// POST
const result = await apiClient.post("/endpoint", payload).then(r => r.data);
```

### `shared/store/` — Redux store
Add feature reducers here when you create a new slice:

```ts
// shared/store/index.ts
import { featureReducer } from "@/features/feature-name/model/slice";

export const store = configureStore({
  reducer: {
    featureName: featureReducer,
  },
});
```

### `shared/hooks/` — Typed Redux hooks
Always use these instead of raw `useSelector`/`useDispatch`:

```ts
import { useAppSelector, useAppDispatch } from "@/shared/hooks";

const value = useAppSelector(state => state.featureName.value);
const dispatch = useAppDispatch();
```

### `shared/lib/` — Utilities
`cn(...classes)` — merges Tailwind classes, resolves conflicts:

```ts
import { cn } from "@/shared/lib/utils";

<div className={cn("base-class", condition && "conditional-class", className)} />
```

### `shared/types/` — Generic TypeScript types
Common utility types: `Nullable<T>`, `Optional<T>`, `ID`, `ApiResponse<T>`, `PaginatedResponse<T>`.

### `shared/config/` — App configuration
Environment-dependent config values (API URL, app name, version).

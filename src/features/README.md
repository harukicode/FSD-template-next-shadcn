# features/

User interactions and business operations — things the user **does**: login, add to cart, submit a form, toggle a setting.

**Can import from:** `shared`, `entities`
**Cannot import from:** `widgets`, `views`, `app`

---

## Folder structure

```
features/
└── feature-name/
    ├── index.ts          ← public API (only export what consumers need)
    ├── model/
    │   ├── types.ts      ← TypeScript interfaces for this feature
    │   └── slice.ts      ← Redux slice (if this feature has global state)
    ├── api/
    │   └── queries.ts    ← TanStack Query hooks (mutations / queries)
    └── ui/
        └── FeatureName.tsx
```

---

## Template: Redux slice

```ts
// features/feature-name/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FeatureState {
  // ...
}

const initialState: FeatureState = {
  // ...
};

export const featureSlice = createSlice({
  name: "featureName",
  initialState,
  reducers: {
    someAction(state, action: PayloadAction<string>) {
      // mutate with Immer
    },
  },
});

export const { someAction } = featureSlice.actions;
export const featureReducer = featureSlice.reducer;
```

After creating a slice — add `featureReducer` to `src/shared/store/index.ts`.

## Template: TanStack Query mutation

```ts
// features/feature-name/api/queries.ts
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/shared/api";

export function useDoSomething() {
  return useMutation({
    mutationFn: (payload: SomePayload) =>
      apiClient.post("/endpoint", payload).then((r) => r.data),
  });
}
```

## Template: public API

```ts
// features/feature-name/index.ts
export { FeatureName } from "./ui/FeatureName";
export type { SomeType } from "./model/types";
// do NOT export internal slice actions — only what consumers need
```

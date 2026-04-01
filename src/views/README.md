# views/

Full page compositions — assemble widgets, features, and entities into a complete page.
One view = one route. Views contain page layout, but no business logic.

**Can import from:** `shared`, `entities`, `features`, `widgets`
**Cannot import from:** `app`

---

## Folder structure

```
views/
└── page-name/
    ├── index.ts
    └── ui/
        └── PageName.tsx
```

---

## Template

```tsx
// views/page-name/ui/PageName.tsx
import { Header } from "@/widgets/header";
import { SomeWidget } from "@/widgets/some-widget";
import { SomeFeature } from "@/features/some-feature";

export function PageName() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-8">
        <SomeWidget />
        <SomeFeature />
      </main>
    </div>
  );
}
```

```ts
// views/page-name/index.ts
export { PageName } from "./ui/PageName";
```

## Connecting to Next.js App Router

```tsx
// app/page-route/page.tsx
import { PageName } from "@/views/page-name";

export default function Page() {
  return <PageName />;
}
```

---

## Rules

- Views compose — they don't implement
- No business logic in views: no API calls, no Redux dispatches, no data transformation
- Keep views thin — if a view is getting complex, extract a widget

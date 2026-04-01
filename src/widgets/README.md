# widgets/

Complex independent UI sections that combine entities and features into a cohesive block.
Examples: `Header`, `Sidebar`, `ProductCard` (with add-to-cart button), `UserMenu`.

**Can import from:** `shared`, `entities`, `features`
**Cannot import from:** `views`, `app`

---

## Folder structure

```
widgets/
└── widget-name/
    ├── index.ts          ← public API
    └── ui/
        └── WidgetName.tsx
```

Widgets rarely need `model/` or `api/` — they orchestrate, not own data.
If a widget needs its own state, check if it belongs in a feature instead.

---

## Template

```tsx
// widgets/widget-name/ui/WidgetName.tsx
import { SomeFeature } from "@/features/some-feature";
import { EntityCard } from "@/entities/entity-name";
import { Button } from "@/shared/ui";

export function WidgetName() {
  return (
    <section>
      <EntityCard />
      <SomeFeature />
    </section>
  );
}
```

```ts
// widgets/widget-name/index.ts
export { WidgetName } from "./ui/WidgetName";
```

---

## Rules

- Widgets are **self-contained** — they shouldn't require many props from the parent
- If a widget needs to talk to another widget, lift that logic to `views/`
- Don't put page-level layout decisions inside a widget

# Understanding Business Logic

One of the hardest parts of architecture is knowing **where logic belongs**. This guide explains business logic with real, concrete examples.

---

## What IS Business Logic?

Business logic is the code that **implements rules your business has**.

It's the difference between:
- "Display this number" (UI logic — not business logic)
- "A user can only have one active subscription at a time" (business rule)

Business logic answers questions like:
- "Can this user do this action?"
- "What happens when the user does X?"
- "How is this value calculated?"
- "What are the rules for this process?"

---

## Levels of Logic

### Level 1: UI Logic

Purely about how things look and interact. No business rules.

```tsx
// UI Logic — where does the dropdown appear? Is the button disabled?
function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <button
      disabled={isLoading}
      className={isLoading ? "opacity-50" : ""}
    >
      {isLoading ? "Submitting..." : "Submit"}
    </button>
  );
}
```

**Where it belongs:** Component `ui/` files

### Level 2: Data Transformation

Converting data between formats. No business rules.

```ts
// Data transformation — formatting for display
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatUserFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}
```

**Where it belongs:** `shared/lib/` utilities

### Level 3: Business Logic ← The Important One

Rules that come from **product requirements and business decisions**.

```ts
// Business logic — can a user apply a discount?
function canApplyDiscount(user: User, order: Order): boolean {
  // Rule 1: User must be verified
  // Rule 2: Order must be over $50
  // Rule 3: User can only use one discount per month
  return (
    user.isVerified &&
    order.total > 5000 && // cents
    !user.hasUsedDiscountThisMonth
  );
}
```

**Where it belongs:** `model/` files in entities and features

---

## Real-World Examples

### Example 1: E-commerce Cart

**Scenario:** Users can add products to a cart. Free shipping for orders over $100.

```ts
// src/entities/cart/model/types.ts
export interface CartItem {
  productId: number;
  name: string;
  price: number;       // in cents
  quantity: number;
  maxQuantity: number; // stock limit
}

export interface Cart {
  items: CartItem[];
  discountCode: string | null;
  discountPercent: number;
}
```

```ts
// src/entities/cart/model/cartCalculations.ts
// ← BUSINESS LOGIC

const FREE_SHIPPING_THRESHOLD = 10000; // $100 in cents
const MAX_DISCOUNT_PERCENT = 50;
const MAX_ITEMS_PER_PRODUCT = 10;

// Business rule: Can more of this item be added?
export function canAddItem(cart: Cart, productId: number, stockAvailable: number): boolean {
  const existingItem = cart.items.find(i => i.productId === productId);
  const currentQty = existingItem?.quantity ?? 0;

  // Rule: Can't exceed stock
  if (currentQty >= stockAvailable) return false;

  // Rule: Max 10 of same item per cart
  if (currentQty >= MAX_ITEMS_PER_PRODUCT) return false;

  return true;
}

// Business rule: Calculate order totals
export function calculateCartTotals(cart: Cart): {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
} {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  // Business rule: Discount is applied to subtotal, not to shipping
  const discount = cart.discountCode
    ? Math.floor(subtotal * (cart.discountPercent / 100))
    : 0;

  // Business rule: Free shipping over $100
  const shipping = subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : 599; // $5.99

  return {
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
  };
}
```

```ts
// src/features/add-to-cart/model/addToCartSlice.ts
// ← Calls business logic, manages state

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { canAddItem } from "@/entities/cart";  // ← uses business logic from entity

const addToCartSlice = createSlice({
  name: "addToCart",
  initialState: { error: null as string | null },
  reducers: {
    addItemFailed(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});
```

### Example 2: User Permissions

**Scenario:** Different user roles have different permissions (admin, editor, viewer).

```ts
// src/entities/user/model/permissions.ts
// ← BUSINESS LOGIC: permission rules

export type Permission =
  | "posts:create"
  | "posts:edit"
  | "posts:delete"
  | "users:manage"
  | "settings:view";

const ROLE_PERMISSIONS: Record<User["role"], Permission[]> = {
  admin: ["posts:create", "posts:edit", "posts:delete", "users:manage", "settings:view"],
  user: ["posts:create", "posts:edit"],
  guest: [],
};

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

// Usage in components:
// if (hasPermission(currentUser, "posts:delete")) { ... }
```

```tsx
// src/shared/ui/PermissionGate.tsx
// ← UI Logic: conditionally render based on permissions (not business logic itself)

"use client";
import { useAppSelector } from "@/shared/hooks";
import { hasPermission } from "@/entities/user";
import type { Permission } from "@/entities/user";

interface PermissionGateProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const user = useAppSelector(s => s.user.currentUser);

  if (!hasPermission(user, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Usage:
// <PermissionGate permission="posts:delete">
//   <DeleteButton />
// </PermissionGate>
```

### Example 3: Booking System

**Scenario:** Users can book meeting rooms. Rules: max 2 hours, can't book in the past, rooms have capacity limits.

```ts
// src/entities/booking/model/bookingRules.ts
// ← PURE BUSINESS LOGIC

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface Room {
  id: number;
  capacity: number;
  name: string;
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
}

const MAX_BOOKING_HOURS = 2;

export function validateBooking(
  slot: TimeSlot,
  room: Room,
  attendeeCount: number,
  existingBookings: TimeSlot[]
): BookingValidation {
  const errors: string[] = [];

  // Rule 1: Can't book in the past
  if (slot.start < new Date()) {
    errors.push("Cannot book a slot in the past");
  }

  // Rule 2: Max 2 hours
  const durationHours = (slot.end.getTime() - slot.start.getTime()) / (1000 * 60 * 60);
  if (durationHours > MAX_BOOKING_HOURS) {
    errors.push(`Maximum booking duration is ${MAX_BOOKING_HOURS} hours`);
  }

  // Rule 3: End must be after start
  if (slot.end <= slot.start) {
    errors.push("End time must be after start time");
  }

  // Rule 4: Room capacity
  if (attendeeCount > room.capacity) {
    errors.push(`Room "${room.name}" has a capacity of ${room.capacity} people`);
  }

  // Rule 5: No overlapping bookings
  const hasConflict = existingBookings.some(
    existing => slot.start < existing.end && slot.end > existing.start
  );
  if (hasConflict) {
    errors.push("This time slot is already booked");
  }

  return { isValid: errors.length === 0, errors };
}
```

**The key insight:** `validateBooking` is pure business logic — it has no React, no Redux, no UI. It's easy to test and can be used anywhere.

---

## How to Identify Business Logic

Ask these questions when you're not sure if something is "business logic":

1. **Would a product manager describe this rule?**
   - "Max 2 hour bookings" → YES → business logic
   - "Show a spinner while loading" → NO → UI logic

2. **Would this rule change if the company's business changed?**
   - "Free shipping over $100" → YES → business logic
   - "The button is blue" → NO → UI logic

3. **Could a non-developer explain why this rule exists?**
   - "Users can't book in the past" → YES → business logic
   - "The dropdown closes on outside click" → NO → UI interaction logic

4. **Would this logic be the same in a mobile app or a CLI tool?**
   - "Calculate discount" → YES → business logic (works anywhere)
   - "Show a modal" → NO → UI specific

---

## Where Business Logic Lives in FSD

| Type of Logic | Layer | Example |
|---|---|---|
| Entity rules & calculations | `entities/[entity]/model/` | `canApplyDiscount()`, `calculateCartTotals()` |
| Entity state transitions | `entities/[entity]/model/[entity]Slice.ts` | `setCurrentUser`, `clearCart` |
| Feature-specific logic | `features/[feature]/model/` | `validateLoginForm()`, `submitOrder()` |
| Feature state | `features/[feature]/model/[feature]Slice.ts` | `loginStart`, `loginSuccess` |
| Pure utilities | `shared/lib/` | `formatDate()`, `cn()` |
| Generic types | `shared/types/` | `ApiResponse<T>`, `PaginatedResponse<T>` |

---

## The "Is This Business Logic?" Test

```
Code you're looking at:
         │
         ▼
Is it about how things look or interact?
         │
    YES ─┤── UI Logic → belongs in component files (ui/)
         │
         ▼
Is it about transforming/formatting data with no rules?
         │
    YES ─┤── Utility → belongs in shared/lib/
         │
         ▼
Is it a rule that comes from the product/business?
         │
    YES ─┤── Business Logic → belongs in model/ of the relevant entity/feature
         │
         ▼
Is it about orchestrating async operations?
         │
    YES ─┘── Side Effect Logic → createAsyncThunk or mutation in features/model/
```

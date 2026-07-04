---
name: lb-code-style
description: Use when writing, reviewing, or refactoring JavaScript, TypeScript, or React code for style or readability, including control flow, loops, lookups, deduping, reduce, ternaries, switch statements, data structures, chained array methods, and function components — plus hot-path performance tradeoffs (object shapes, allocations, tight loops, Map/Set) when optimizing performance-sensitive JS/TS such as parsers or core libraries. Covers guard clauses vs nesting and switch vs lookup objects.
---

# Code style preferences

## Overview

Readability wins unless a repo convention, ESLint rule, or hot-path performance concern says otherwise.

These are defaults for JS/TS control flow, data structures, and React components. Apply the smallest rule that fits the code in front of you.

## Quick reference

| Situation                                  | Prefer                              | Avoid                                          |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------- |
| Invalid or finished case                   | Early return                        | Wrapping the rest of the function in `else`    |
| Branching assignment                       | IIFE with early returns             | `let` declared outside and mutated in branches |
| 3+ cases on one value with different logic | `switch`                            | Long `if`/`else if` chains                     |
| Pure key-to-value mapping                  | Lookup object or `Record`           | `switch` or chained conditionals               |
| Side-effect iteration                      | `for...of`                          | `.forEach` or index loops                      |
| Multi-step transform                       | One `for...of` pass or `.flatMap`   | Long `.filter().map().join()` chains           |
| Lookup or dedupe by key                    | `Map` or `Set`                      | Re-scanning arrays inside loops                |
| Complex aggregate                          | Explicit loop                       | `.reduce` that needs explanation               |
| Conditional value                          | One ternary, lookup, or `if`/`else` | Nested ternaries                               |
| React component                            | Function component                  | Class component                                |
| Arrow body wraps                           | Block body with `return`            | Multi-line implicit return                     |

## Rules

### Use early returns

Guard clauses keep the main path flat.

```ts
// Prefer
function getDiscount(user: User) {
	if (!user.isMember) return 0;
	if (user.orders.length === 0) return 0;

	return 0.1;
}

// Avoid
function getDiscount(user: User) {
	if (user.isMember) {
		if (user.orders.length > 0) return 0.1;
		return 0;
	}
	return 0;
}
```

### Keep branching assignments const

When one value needs branching logic, use an IIFE instead of mutating a `let`.

```ts
const progress: number = (() => {
	if (navigation.state === "idle" && animationComplete) return 0;
	if (navigation.state === "submitting") return (4 / 12) * 100;
	if (navigation.state === "loading") return (10 / 12) * 100;
	if (navigation.state === "idle" && !animationComplete) return 100;

	return 0;
})();
```

Use a lookup object instead when the value is a pure map from one key.

### Choose switch only for different logic

Use `switch` when 3+ branches inspect the same value and each branch does different work.

```ts
switch (event.type) {
	case "created":
		notify(event.user);
		return;
	case "cancelled":
		refund(event.orderId);
		return;
	case "shipped":
		trackPackage(event.trackingId);
		return;
}
```

If each branch only returns a value, use a lookup object.

```ts
const STATUS_LABEL: Record<Status, string> = {
	pending: "Waiting",
	shipped: "On its way",
	delivered: "Delivered",
};

function describeOrder(status: Status) {
	return STATUS_LABEL[status];
}
```

Use `if`/`else` when there are only two branches or the conditions are unrelated.

### Prefer for...of for side effects

Use `for...of` when iterating for side effects, especially when `break`, `continue`, or `return` might matter.

```ts
for (const order of orders) {
	process(order);
}
```

This does not apply to array methods that return the value you need. JSX list rendering with `.map` is correct.

```tsx
return orders.map((order) => <Row key={order.id} order={order} />);
```

### Avoid chaining array methods

Each `.filter().map().join()` link allocates a throwaway array and walks the data again. A single `for...of` pass does the same work once, and it sidesteps the TypeScript friction chains create — type predicates for `.filter`, truthy narrowing, and the like. Encapsulate the loop in a function so the mutation stays local.

```ts
// Avoid — three passes, two intermediate arrays
function makeDisplayName(...parts: unknown[]) {
	return parts
		.filter((part) => Boolean(part) && typeof part === "string")
		.map((part) => part.trim())
		.join(" ");
}

// Prefer — one pass
function makeDisplayName(...parts: unknown[]) {
	let name = "";

	for (const part of parts) {
		if (part && typeof part === "string") {
			name = name ? `${name} ${part.trim()}` : part.trim();
		}
	}

	return name;
}
```

When you are mapping-and-filtering and want to stay declarative, reach for a single `.flatMap` (return `[]` to drop an item) instead of `.map().filter()`. Use a guard clause in the callback rather than a ternary.

```ts
const paidIds = orders.flatMap((order) => {
	if (!order.paid) return [];

	return [order.id];
});
```

Two chained calls on a small array are fine. This matters when the chain is long, the array is large, or the transform runs often — such as client-side rendering over a full dataset.

### Use Map and Set for repeated lookup

Use `Map` or `Set` when checking membership, deduping, or looking up by key across a collection.

```ts
const seen = new Set<string>();

const unique = orders.filter((order) => {
	if (seen.has(order.id)) return false;

	seen.add(order.id);
	return true;
});

const byId = new Map(orders.map((order) => [order.id, order]));
```

Plain arrays are fine for one-off checks on tiny collections. Avoid `.find`, `.includes`, or `.filter` inside a loop when the collection can grow.

### Avoid clever reduce

`.reduce` is fine for a simple fold. Use an explicit loop when the accumulator has multiple fields or branchy updates.

```ts
const totals = { paid: 0, pending: 0 };

for (const order of orders) {
	if (order.status === "paid") totals.paid += order.amount;
	else totals.pending += order.amount;
}
```

### Avoid nested ternaries

One ternary is fine. If a ternary nests another ternary, switch to a lookup object (as above) or `if`/`else`.

```ts
// Avoid
const discount =
	status === "paid" ? price : status === "pending" ? price * 0.95 : 0;

// Prefer
function applyDiscount(status: Status, price: number) {
	if (status === "paid") return price;
	if (status === "pending") return price * 0.95;

	return 0;
}
```

### Prefer function components

Use function components for React code unless the codebase has a class-component convention.

```tsx
function OrderRow({ order }: { order: Order }) {
	return <tr>{order.id}</tr>;
}
```

### Use block bodies once arrow returns wrap

Implicit returns should fit on one line. If the returned expression wraps, use a block body and explicit `return`.

```ts
const total = (order: Order) =>
	order.items.reduce((sum, item) => sum + item.price, 0);

const summarize = (order: Order) => {
	const total = order.items.reduce((sum, item) => sum + item.price, 0);

	return { id: order.id, total };
};
```

## Common mistakes

- Applying `switch` to two branches or unrelated conditions.
- Using `Map` or `Set` for a one-off lookup in a tiny array.
- Using an IIFE when a lookup object would express a pure mapping.
- Replacing `.map`, `.filter`, or simple `.reduce` calls that already return the needed value clearly.
- Treating these preferences as lint rules when local convention says otherwise.
- Applying the hot-path rules below to ordinary code without profiling — they trade readability for speed you can't measure there.

## Hot-path performance

Everything above optimizes for readability. In genuinely hot code — parsers, core-library internals, tight loops that run millions of times — engine behaviour can outweigh readability, and a few rules above invert. This is an override, not a new default: keep it out of ordinary application code.

**Measure before you trade readability away.** Profile to confirm the bottleneck is this code (CPU, allocation/GC, or algorithmic complexity), benchmark the smallest representative workload with a warm-up, and keep the change only when the numbers pay for the added complexity. Treat every rule below as a hypothesis — V8 behaviour shifts between versions.

### Keep object shapes stable

V8 specializes on an object's "shape" (hidden class). Initialize objects with the same properties in the same order, never add a property conditionally (set it to `undefined` instead), and never `delete` a property — `delete` drops the object into slow dictionary mode, so assign `undefined` to clear it. Keep function parameter types stable across calls; mixed types block the optimizing compiler.

### Choose collections for the access pattern

- Prefer `Map` over a plain object for dynamic, growing key/value collections; reserve objects for static, known-shape data.
- `Set.has()` beats `Array.includes()` for repeated membership checks (O(1) vs O(n)) — the hot-path extension of the Map/Set rule above.
- Read a `Map` once: `const value = map.get(k); if (value) …` instead of `map.has(k)` then `map.get(k)`, which hashes the key twice. Only when `undefined` is not a valid stored value.
- Keep arrays homogeneous — an all-integer array uses V8's fastest storage; mixing in a float or a string transitions it, one-way, to a slower representation.

### Tighten loops

- In measured tight loops, an index-based `while`/`for` can beat `for...of` and `.forEach` — the opposite of the readability default. Only where a profiler or benchmark shows the iterator/callback overhead matters.
- Use numeric state and integer tags rather than strings; a `switch` over a numeric tag beats one over string values (integer comparison is O(1), strings compare character by character).
- Cache repeated linear scans over unchanging data — a `.find`/`.filter` per outer-loop item is O(n×m); build a `Map`/`Set` once and look up inside the loop.
- Hoist invariant work out of the loop body — string building, `new RegExp`, and any expression that doesn't vary with the iteration.

### Minimize allocations

Every `{}`, `[]`, `new`, and `{...spread}` in a hot loop is GC work. Avoid spread-copying objects on the hot path (mutate, or use a dedicated clone); avoid `structuredClone` for shallow copies. Cache deep property chains in a local (`const c = obj.a.b.c`). Memoize allocators whose output is deterministic from their inputs, but only when inputs recur and callers treat the result as immutable.

### Prefer simple string ops over regex

For simple parsing, scan with `indexOf`/`slice`/`charCodeAt` rather than reaching for regex or `.split()` — regex carries engine overhead and `.split()` allocates an intermediate array. Gate a regex behind `.includes()`/`.startsWith()` for the common non-matching case, and cache compiled regexes outside loops. Native `.split()` is a fast C++ builtin, though — don't hand-roll char-by-char accumulation to beat it; only skip it when a single `indexOf`/`slice` pass extracts what you need with no array.

### Control flow and async

- Don't use `try`/`catch` for expected outcomes — prefer APIs that return `null`/`undefined` (constructing an `Error` captures a stack trace). Keep `try` blocks small so surrounding code optimizes freely.
- Avoid unnecessary `async`/`await` in hot loops; don't `await` a non-promise or wrap an already-async function. Cap concurrency on `Promise.all` over dynamic-length arrays so parallel I/O can't exhaust memory or file descriptors.
- Generators pay a per-`yield` suspend/resume cost — offer an array-returning path for callers that need every result.

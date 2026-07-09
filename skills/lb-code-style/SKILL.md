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
| File organization                          | Important code first, helpers below | Helpers first, main logic buried at the bottom |
| Invalid or finished case                   | Early return                        | Wrapping the rest of the function in `else`    |
| Branching assignment                       | Inline IIFE, early returns, typed   | `let` declared outside and mutated in branches |
| Value built by several `if` blocks         | Isolate in one function             | Mutation scattered through the caller          |
| Helper params mirroring a props type       | Derive with `Pick`/indexed access   | Hand-copied field types                        |
| 3+ cases on one value with different logic | `switch`                            | Long `if`/`else if` chains                     |
| Pure key-to-value mapping                  | Lookup object or `Record`           | `switch` or chained conditionals               |
| Side-effect iteration                      | `for...of`                          | `.forEach` or index loops                      |
| Multi-step transform                       | One `for...of` pass or `.flatMap`   | Long `.filter().map().join()` chains           |
| Lookup or dedupe by key                    | `Map` or `Set`                      | Re-scanning arrays inside loops                |
| Complex aggregate                          | Explicit loop                       | `.reduce` that needs explanation               |
| Conditional value                          | One ternary, lookup, or `if`/`else` | Nested ternaries                               |
| React component                            | Function component                  | Class component                                |
| Function that returns JSX                  | Component (`<Name />`)              | `render*()` helper called directly             |
| Prop forwarded to a wrapped primitive      | Keep the primitive's name           | Renaming without a strong reason               |
| Boolean React prop                         | `is`/`has`/`can` prefix             | Bare `disabled` pass-through; many per axis    |
| Arrow body wraps                           | Block body with `return`            | Multi-line implicit return                     |

## Rules

### Order code by importance, not by dependency

Put the most important function first — usually the exported component or entry point — with its helpers below it. Function declarations (`function foo() {}`) are hoisted, so a function can call helpers defined later in the same file. A reader sees the big picture first and can stop once they have what they need, instead of wading through implementation details to find the part that matters.

```ts
// Prefer — the entry point reads first, helpers follow
export function Invoice(props: InvoiceProps) {
	const total = calculateTotal(props.lineItems);

	return <Text>{formatCurrency(total)}</Text>;
}

function calculateTotal(lineItems: LineItem[]) {
	// ...
}

function formatCurrency(amount: number) {
	// ...
}

// Avoid — helpers first bury the part the reader came for
function calculateTotal(lineItems: LineItem[]) {
	// ...
}

function formatCurrency(amount: number) {
	// ...
}

export function Invoice(props: InvoiceProps) {
	const total = calculateTotal(props.lineItems);

	return <Text>{formatCurrency(total)}</Text>;
}
```

This relies on hoisting, so helpers must be `function` declarations, not `const helper = () => {}` — arrow functions aren't hoisted and throw if called before their line runs.

Exported types and interfaces aren't order-sensitive the same way — keep them near the top of the file. They're the public contract a reader needs before anything else, not an implementation detail to defer.

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

Annotate the result explicitly, especially when the value feeds a specific prop — derive the type from that prop (`ComponentProps<T>["propName"]`) instead of restating its shape by hand. This documents intent at the declaration site and makes TypeScript flag a branch that returns the wrong shape.

```ts
const confirmLabel: ButtonProps["children"] = (() => {
	if (formState === "submitting") return "Saving…";
	if (formState === "error") return "Try again";

	return "Save";
})();
```

Keep the IIFE inline at its point of use so it closes over local variables directly. Only pull it into a standalone top-level function when the logic is reused elsewhere, or must exist as a stable reference rather than an immediately-resolved value — e.g. a callback passed as a render prop.

```ts
// Avoid — forces the caller's locals to be threaded through as parameters,
// and separates the branches from the one place that reads the result
function resolveConfirmLabel(formState: FormState, hasUnsavedChanges: boolean) {
	if (formState === "submitting") return "Saving…";
	if (formState === "error") return "Try again";
	if (!hasUnsavedChanges) return "Done";

	return "Save";
}
const confirmLabel = resolveConfirmLabel(formState, hasUnsavedChanges);

// Prefer — colocated inline IIFE, no parameters to keep in sync
const confirmLabel: ButtonProps["children"] = (() => {
	if (formState === "submitting") return "Saving…";
	if (formState === "error") return "Try again";
	if (!hasUnsavedChanges) return "Done";

	return "Save";
})();
```

The top-level extraction earns its keep once the result must be handed off as a callback instead of resolved immediately:

```tsx
// EmptyState is its own module-level component, not nested inside OrderList
function EmptyState({ status }: { status: FetchStatus }) {
	if (status === "loading") return <Spinner />;

	return <p>No results</p>;
}

function OrderList({ status, listProps }: OrderListProps) {
	// the prop expects a function React calls later, not a resolved node — extraction is required
	const renderEmptyState =
		listProps?.renderEmptyState ?? (() => <EmptyState status={status} />);

	// ...
}
```

A function that returns JSX should be a component (`<EmptyState status={status} />`), not a `renderEmptyState()` helper you call directly — a component gets its own boundary, hooks, and DevTools identity. The `() => …` thunk is still required here because the prop wants a callback React invokes later, so only its render-time inputs are passed through as props. The thunk is a closure and belongs inside the parent; the component it renders stays at module scope.

### Isolate multi-step object construction

When building one object takes several independent `if` blocks that each mutate it, pull the whole thing into a dedicated function instead of scattering the mutation through the surrounding component or handler. The mutation itself is fine — owning it in one clearly-named function beats spreading it across a render body.

```ts
// Avoid — mutation scattered through the caller, mixed in with unrelated logic
function submitForm(form: FormValues) {
	const requestInit: RequestInit = { method: "POST", body: JSON.stringify(form) };
	if (form.isRetry) requestInit.headers = { "Idempotency-Key": form.id };
	if (form.attachment) requestInit.body = toFormData(form);
	// ...fetch(url, requestInit)
}

// Prefer — one pure function owns the branching and the mutation
function buildRequestInit(form: FormValues): RequestInit {
	const requestInit: RequestInit = { method: "POST", body: JSON.stringify(form) };
	if (form.isRetry) requestInit.headers = { "Idempotency-Key": form.id };
	if (form.attachment) requestInit.body = toFormData(form);

	return requestInit;
}
```

### Derive helper types instead of restating them

When a helper's parameters mirror fields already declared on a props interface, derive the type with `Pick` or indexed access instead of retyping each field by hand. Hand-written duplicates drift silently — a field can end up wider or narrower than the real prop.

```ts
// Avoid — duplicated, and can drift (here `role` is typed as `string`, wider than the real prop)
function canEditOrder(user: { role: string; isOwner: boolean }) {}

// Prefer
function canEditOrder(user: Pick<User, "role" | "isOwner">) {}
```

### Match prop names to the primitive being wrapped

When a component forwards a prop straight through to an underlying primitive, keep the primitive's name unless the rename earns its keep. Matching names make the API predictable to anyone who already knows the primitive, and let the type be reused directly (`PrimitiveProps["propName"]`) instead of re-declared under a new name.

```ts
// Avoid — invents a new name for something the primitive already calls `padding`
interface CardProps {
	spacing?: BoxProps["padding"];
}

// Prefer
interface CardProps {
	padding?: BoxProps["padding"];
}
```

### Name boolean props by their job

Use a boolean only for stable two-state ideas. If the same axis could grow another option, use a string union so adding a value stays non-breaking.

```tsx
// Prefer
<Table density="compact" />
<Tooltip placement="top" />

// Avoid
<Table isCompact />
<Tooltip alignTop alignBottom alignLeft alignRight />
```

Name every boolean with the `is`/`has`/`can` convention so it reads like a question: `isOpen`, `isLoading`, `hasSearch`, `canDelete`. Apply this even to booleans that mirror a native HTML attribute or a wrapped primitive's prop — prefer `isDisabled`, `isChecked`, `isRequired`, `isReadOnly` over bare `disabled`/`checked`. For booleans this overrides "Match prop names to the primitive being wrapped" above; the question-form name wins. Use `has` for added structure or behavior, not visual styling.

Default booleans to `false` so consumers opt in with a bare prop instead of opting out with `={false}`. Use `showX` for optional extras off by default and `hideX` for default anatomy consumers can remove. The name should tell the consumer what the default is. Avoid double negatives like `isNotVisible`; when accepting a negative prop, derive a positive local name.

```tsx
// hideLabel defaults to false — derive a positive name for local logic
const isLabelVisible = !hideLabel;
```

### Name component callbacks by control model

Use `isOpen`/`onOpenChange` when a component owns controllable visibility; dismissal closes with `onOpenChange(false)`. Use `onDismiss` when the consumer owns rendering and dismissal is only an action.

```tsx
// Component owns the state — expose it and report every change
<Dialog isOpen={isOpen} onOpenChange={setIsOpen} />
// Consumer owns rendering — dismissal is a one-way action, not held state
{toast ? <Toast onDismiss={() => setToast(null)} /> : null}
```

Component callbacks pass semantic values (`onChange(value)`, `onSortChange(descriptor)`), not DOM events, unless wrapping a native element API or third-party library callback shape.

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

### Render JSX with a component, not a helper

A function that returns JSX should be a component (`<EmptyState />`), not a `renderEmptyState()` helper you call inline. A component gets its own reconciliation identity, hook scope, and DevTools entry; a called helper gets none of these — it just splices nodes into the parent. Define the component at module scope, never inside another component's body: a nested definition is a new function identity on every render, so React remounts its subtree and discards its state. Reach for a render-prop thunk (`() => <EmptyState … />`) only when the API requires a function it invokes later.

```tsx
// Avoid — a JSX-returning helper defined and called inside the parent
function OrderList({ status }: OrderListProps) {
	function renderEmptyState() {
		if (status === "loading") return <Spinner />;

		return <p>No results</p>;
	}

	return <div>{renderEmptyState()}</div>;
}

// Prefer — a sibling component at module scope
function EmptyState({ status }: { status: FetchStatus }) {
	if (status === "loading") return <Spinner />;

	return <p>No results</p>;
}

function OrderList({ status }: OrderListProps) {
	return (
		<div>
			<EmptyState status={status} />
		</div>
	);
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
- Duplicating the same validation condition and error message across two functions (e.g. a dev-only early check and the real runtime guard) — keep one source of truth, even if only one caller runs in development.

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

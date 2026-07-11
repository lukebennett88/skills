---
name: lb-domain-modeling
description: Use when pinning down project terminology, sharpening fuzzy domain language, or recording a durable design decision — or when another skill needs to maintain the project's vocabulary and docs.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing decisions down the moment they crystallise. (Merely *reading* the project's docs for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## Where things get written

There's no single glossary file and no ADR directory here. Durable knowledge lives in `AGENTS.md` and dedicated per-topic docs under `docs/`, updated in the same change as the code they describe:

- **An existing `docs/TOPIC.md` owns the area** (e.g. `docs/CONVENTIONS.md`, `docs/TESTING.md`) → update it in place.
- **No doc owns it and the topic is durable** → create a new `docs/<TOPIC>.md`.
- **A small repo-wide agent-facing fact** → a bullet in `AGENTS.md`.
- **Anything still in flux** → the current planning notes under `.scratch/<feature>/`, committed alongside the rest of the effort.

## During the session

### Challenge against the docs

When the user uses a term that conflicts with the existing language in the project's docs (`AGENTS.md` and `docs/`), call it out immediately. "Your docs define 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update docs inline

When a term or decision is resolved, update the owning topic doc (or `AGENTS.md`) right there. Don't batch these up — capture them as they happen.

### Is it worth writing down?

Not every decision earns a place in the docs. Write one down when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip it. When it passes, record the decision — with its why — in the topic doc that owns the area, or in `AGENTS.md` if nothing owns it yet. Never a separate ADR file.

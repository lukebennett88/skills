---
name: lb-to-spec
description: Use when the current conversation has already settled the decisions and should be synthesised into a spec (PRD) published to the issue tracker — no interview, just synthesis.
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding and produces a spec (you may know this document as a PRD). Do NOT interview the user — just synthesize what you already know. The seam check and the tracker question below are operational confirmations, not interview questions — if both are open, ask them together in one reply, and publish nothing until both are answered.

## Resolving the issue tracker

Resolve the tracker before reading or writing any issue:

1. If the repo has a `.scratch/` directory containing issue files, use the local markdown tracker (`.scratch/<feature>/issues/`) without asking. Local markdown never needs publish confirmation — the files land in the working tree, where they're reviewed before committing.
2. Otherwise, ask the user which tracker to use this session: GitHub Issues (`gh` CLI), GitLab (`glab` CLI), local markdown, or something else they describe (e.g. Linear).
3. For a real (non-local) tracker, confirm the concrete target once before the session's first issue-creating operation — "Publishing to <tracker> on <repo> — ok?" — then don't ask again. Reads never need confirmation.

Planning artefacts under `.scratch/` are committed, never gitignored — they must travel with worktrees, clones, and other harnesses.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's established vocabulary — check `AGENTS.md` and `docs/` — throughout the spec, and respect documented decisions in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Check with the user that these seams match their expectations.

3. Write the spec using the template below, then publish it to the project issue tracker. Apply the `ready-for-agent` triage label - no need for additional triage. When the tracker is local markdown, the spec is published to `.scratch/<feature-slug>/spec.md`.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts — not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>

Break the spec into tickets with `/lb-to-tickets`.

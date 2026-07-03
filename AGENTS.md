# Skills Repo

A collection of agent-agnostic skills following the [Agent Skills specification](https://agentskills.io/specification). Skills are distributed via `npx skills add lukebennett88/skills`.

## Structure

- `skills/<name>/SKILL.md` — canonical location for every skill; flat, one directory per skill
- `skills/<name>/references/` — heavy reference material, loaded on demand
- `skills/<name>/scripts/` — executable tools a skill uses
- `template/SKILL.md` — starter template for new skills (not itself a skill)
- `scripts/validate.mjs` — spec validator, run in CI

## Conventions

**Frontmatter:** `name` and `description` only, unless a skill genuinely needs `compatibility` or `metadata`. `name` must match the directory name exactly (lowercase letters, numbers, single hyphens). The repo-level MIT LICENSE covers all skills; omit per-skill `license` fields.

**Descriptions state triggering conditions, never workflow.** Start with "Use when..." and list the symptoms, situations, and phrases that should fire the skill. A description that summarizes the skill's process becomes a shortcut agents follow instead of reading the body.

**Keep SKILL.md under 500 lines.** Push anything heavier down the hierarchy: reference material into `references/`, reusable code into `scripts/`, linked by relative path one level deep.

**Name skills verb-first with gerunds** where they describe a process (`writing-plans`, not `plan-writing`) and by what they do or their core insight, not their category.

**Skills are tested before they land.** Run a baseline scenario without the skill, document the failure, write the skill against those specific failures, and verify the scenario passes with the skill present. Don't batch multiple untested skills into one change.

## Verification

```bash
node scripts/validate.mjs
```

Must pass with zero errors before committing.

# Skills

A collection of agent skills for coding assistants, following the [Agent Skills specification](https://agentskills.io/specification). Works with Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, Amp, OpenCode, and any other agent that reads the `SKILL.md` format.

## Install

Install all skills:

```bash
npx skills add lukebennett88/skills
```

Install a single skill:

```bash
npx skills add lukebennett88/skills/<skill-name>
```

The [skills CLI](https://skills.sh) symlinks skills into each agent's directory, so `npx skills update` keeps them current.

## Skills

<!-- One row per skill: | [name](skills/name/SKILL.md) | one-line hook | -->

| Skill | Description |
|-------|-------------|
| [lb-code-review](skills/lb-code-review/SKILL.md) | Two-axis review of a diff — standards compliance and spec fidelity — via parallel sub-agents |
| [lb-code-style](skills/lb-code-style/SKILL.md) | JS/TS and React readability defaults — early returns, lookups over switch, Map/Set for lookups, plain loops over clever reduce |
| [lb-deslop](skills/lb-deslop/SKILL.md) | Make prose specific, plain, and readable — remove AI tells, filler, and formulaic structure |
| [lb-domain-modeling](skills/lb-domain-modeling/SKILL.md) | Pin down project vocabulary and record durable decisions in `AGENTS.md` and `docs/` as the model sharpens |
| [lb-grill-with-docs](skills/lb-grill-with-docs/SKILL.md) | One relentless interview to sharpen a plan, capturing terms and decisions into project docs as they crystallise |
| [lb-grilling](skills/lb-grilling/SKILL.md) | Relentless one-question-at-a-time interview to stress-test a plan or design |
| [lb-implement](skills/lb-implement/SKILL.md) | Build a spec or ticket, using TDD at agreed seams, then hand off to code review |
| [lb-prototype](skills/lb-prototype/SKILL.md) | Throwaway UI or logic prototype to answer a design question fast |
| [lb-tdd](skills/lb-tdd/SKILL.md) | Red-green-refactor discipline — seams, good vs bad tests, and mocking rules |
| [lb-to-spec](skills/lb-to-spec/SKILL.md) | Synthesize the current conversation into a spec (PRD) published to the issue tracker |
| [lb-to-tickets](skills/lb-to-tickets/SKILL.md) | Break a spec or plan into tracer-bullet tickets with blocking edges on the issue tracker |
| [lb-wayfinder](skills/lb-wayfinder/SKILL.md) | Chart a big chunk of work as a map of investigation tickets, resolved one session at a time |

## Planning pipeline

The engineering skills form a pipeline, each step handing off to the next:

1. [lb-grill-with-docs](skills/lb-grill-with-docs/SKILL.md) (or [lb-wayfinder](skills/lb-wayfinder/SKILL.md) for work too big for one session) — sharpen the plan
2. [lb-to-spec](skills/lb-to-spec/SKILL.md) — synthesize it into a spec
3. [lb-to-tickets](skills/lb-to-tickets/SKILL.md) — break the spec into tickets
4. [lb-implement](skills/lb-implement/SKILL.md) — build a ticket
5. [lb-code-review](skills/lb-code-review/SKILL.md) — review the result

[lb-grilling](skills/lb-grilling/SKILL.md), [lb-domain-modeling](skills/lb-domain-modeling/SKILL.md), [lb-prototype](skills/lb-prototype/SKILL.md), and [lb-tdd](skills/lb-tdd/SKILL.md) are supporting skills the pipeline invokes along the way.

These ten skills are forked from [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## Structure

```
skills/
  <skill-name>/
    SKILL.md          # required — frontmatter (name, description) + body
    references/       # optional — heavy docs, loaded on demand
    scripts/          # optional — executable tools
template/
  SKILL.md.template   # starter template for new skills
scripts/
  validate.mjs        # spec validator (runs in CI)
  validate.test.mjs   # validator tests (run in CI)
```

## Writing a new skill

1. Copy `template/SKILL.md.template` to `skills/lb-<skill-name>/SKILL.md`. All skills are prefixed `lb-` so `/lb` surfaces them and names never collide with skills from other sources.
2. Set `name` (must match the directory) and `description` (triggering conditions only, start with "Use when").
3. Keep the body under 500 lines; push heavy material into `references/` or `scripts/`.
4. Test it: run the scenario without the skill, confirm the failure, then confirm the skill fixes it.
5. Validate:

```bash
node scripts/validate.mjs
node --test scripts/validate.test.mjs
```

See [AGENTS.md](AGENTS.md) for full conventions.

## License

[MIT](LICENSE)

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
| [lb-code-style](skills/lb-code-style/SKILL.md) | JS/TS and React readability defaults — early returns, lookups over switch, Map/Set for lookups, plain loops over clever reduce |
| [lb-deslop](skills/lb-deslop/SKILL.md) | Make prose specific, plain, and readable — remove AI tells, filler, and formulaic structure |

## Structure

```
skills/
  <skill-name>/
    SKILL.md          # required — frontmatter (name, description) + body
    references/       # optional — heavy docs, loaded on demand
    scripts/          # optional — executable tools
template/
  SKILL.template.md   # starter template for new skills
scripts/
  validate.mjs        # spec validator (runs in CI)
  validate.test.mjs   # validator tests (run in CI)
```

## Writing a new skill

1. Copy `template/SKILL.template.md` into `skills/lb-<skill-name>/` as `SKILL.md`. All skills are prefixed `lb-` so `/lb` surfaces them and names never collide with skills from other sources.
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

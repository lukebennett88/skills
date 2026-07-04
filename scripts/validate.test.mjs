import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { validateRepo } from './validate.mjs';

function createRepo(files) {
	const root = mkdtempSync(join(tmpdir(), 'skills-validate-'));

	for (const [path, content] of Object.entries(files)) {
		const fullPath = join(root, path);
		mkdirSync(dirname(fullPath), { recursive: true });
		writeFileSync(fullPath, content);
	}

	return root;
}

function validSkill(name = 'lb-example') {
	return `---
name: ${name}
description: Use when checking a valid fixture skill.
---
# Example

## Overview

Use this body for validator tests.
`;
}

function validMetadata() {
	return `display_name: Example
short_description: Check a valid fixture skill.
default_prompt: Use $lb-example to check this fixture.
`;
}

function validReadme() {
	return `# Skills

| Skill | Description |
|-------|-------------|
| [lb-example](skills/lb-example/SKILL.md) | Check a valid fixture skill. |
`;
}

function withRepo(files, callback) {
	const root = createRepo(files);

	try {
		callback(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test('accepts valid skill repo', () => {
	withRepo(
		{
			'README.md': validReadme(),
			'skills/lb-example/SKILL.md': validSkill(),
			'skills/lb-example/agents/openai.yaml': validMetadata(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.deepEqual(result.errors, []);
			assert.deepEqual(result.warnings, []);
			assert.equal(result.checked, 1);
		},
	);
});

test('accepts block scalar default_prompt metadata', () => {
	withRepo(
		{
			'README.md': validReadme(),
			'skills/lb-example/SKILL.md': validSkill(),
			'skills/lb-example/agents/openai.yaml': `display_name: Example
short_description: Check a valid fixture skill.
default_prompt: |
  Use $lb-example to check this fixture.
`,
		},
		(root) => {
			const result = validateRepo(root);

			assert.deepEqual(result.errors, []);
			assert.deepEqual(result.warnings, []);
			assert.equal(result.checked, 1);
		},
	);
});

test('rejects body-level trigger headings', () => {
	withRepo(
		{
			'README.md': validReadme(),
			'skills/lb-example/SKILL.md': `---
name: lb-example
description: Use when checking trigger placement.
---
# Example

## When to Use

Do not put trigger guidance here.
`,
			'skills/lb-example/agents/openai.yaml': validMetadata(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(result.errors.join('\n'), /move "When to Use" guidance into the description/);
		},
	);
});

test('rejects descriptions without Use when prefix', () => {
	withRepo(
		{
			'README.md': validReadme(),
			'skills/lb-example/SKILL.md': `---
name: lb-example
description: Checks valid fixture skills.
---
# Example

## Overview

Use body validator tests.
`,
			'skills/lb-example/agents/openai.yaml': validMetadata(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(result.errors.join('\n'), /description must start with "Use when"/);
		},
	);
});

test('rejects invalid agent metadata', () => {
	withRepo(
		{
			'README.md': validReadme(),
			'skills/lb-example/SKILL.md': validSkill(),
			'skills/lb-example/agents/openai.yaml': `display_name: Example
short_description: Check a valid fixture skill.
default_prompt: Use the example checker.
`,
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(result.errors.join('\n'), /default_prompt must include "lb-example"/);
		},
	);
});

test('rejects READMEs that omit skill links', () => {
	withRepo(
		{
			'README.md': '# Skills\n',
			'skills/lb-example/SKILL.md': validSkill(),
			'skills/lb-example/agents/openai.yaml': validMetadata(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(result.errors.join('\n'), /missing skill table link for lb-example/);
		},
	);
});

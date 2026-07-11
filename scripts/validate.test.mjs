// @ts-check

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { validateRepo } from "./validate.mjs";

/**
 * @typedef {Record<string, string>} FileMap
 * @typedef {(root: string) => void} RepoCallback
 */

/**
 * @param {FileMap} files
 * @returns {string}
 */
function createRepo(files) {
	const root = mkdtempSync(join(tmpdir(), "skills-validate-"));

	for (const [path, content] of Object.entries(files)) {
		const fullPath = join(root, path);
		mkdirSync(dirname(fullPath), { recursive: true });
		writeFileSync(fullPath, content);
	}

	return root;
}

function validSkill(name = "lb-example") {
	return `---
name: ${name}
description: Use when checking a valid fixture skill.
---
# Example

## Overview

Use this body for validator tests.
`;
}

function validReadme() {
	return `# Skills

| Skill | Description |
|-------|-------------|
| [lb-example](skills/lb-example/SKILL.md) | Check a valid fixture skill. |
`;
}

/**
 * @param {FileMap} files
 * @param {RepoCallback} callback
 */
function withRepo(files, callback) {
	const root = createRepo(files);

	try {
		callback(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

test("accepts valid skill repo", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": validSkill(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.deepEqual(result.errors, []);
			assert.deepEqual(result.warnings, []);
			assert.equal(result.checked, 1);
		},
	);
});

test("ignores dot-directories in skills/", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": validSkill(),
			"skills/.archive/notes.md": "not a skill\n",
		},
		(root) => {
			const result = validateRepo(root);

			assert.deepEqual(result.errors, []);
			assert.equal(result.checked, 1);
		},
	);
});

test("accepts quoted and block scalar descriptions", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: "Use when checking: quoted values."
---
# Example
`,
		},
		(root) => {
			assert.deepEqual(validateRepo(root).errors, []);
		},
	);

	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: >-
  Use when checking folded
  block scalar values.
---
# Example
`,
		},
		(root) => {
			assert.deepEqual(validateRepo(root).errors, []);
		},
	);
});

test("rejects body-level trigger headings", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: Use when checking trigger placement.
---
# Example

## When to Use

Do not put trigger guidance here.
`,
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(
				result.errors.join("\n"),
				/move "When to Use" guidance into the description/,
			);
		},
	);
});

test("rejects renamed and deeper trigger headings", () => {
	for (const heading of [
		"### When to Use",
		"## When to reach for this",
		"## Triggers",
	]) {
		withRepo(
			{
				"README.md": validReadme(),
				"skills/lb-example/SKILL.md": `---
name: lb-example
description: Use when checking trigger placement.
---
# Example

${heading}

Do not put trigger guidance here.
`,
			},
			(root) => {
				const result = validateRepo(root);

				assert.equal(
					result.errors.length,
					1,
					`expected "${heading}" to be rejected`,
				);
			},
		);
	}
});

test("allows trigger headings quoted inside code fences", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: Use when checking trigger placement.
---
# Example

\`\`\`markdown
## When to Use
\`\`\`
`,
		},
		(root) => {
			assert.deepEqual(validateRepo(root).errors, []);
		},
	);
});

test("allows disable-model-invocation frontmatter field", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: Use when checking allowed frontmatter fields.
disable-model-invocation: true
---
# Example
`,
		},
		(root) => {
			assert.deepEqual(validateRepo(root).errors, []);
		},
	);
});

test("rejects descriptions without Use when prefix", () => {
	withRepo(
		{
			"README.md": validReadme(),
			"skills/lb-example/SKILL.md": `---
name: lb-example
description: Checks valid fixture skills.
---
# Example

## Overview

Use body validator tests.
`,
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(
				result.errors.join("\n"),
				/description must start with "Use when"/,
			);
		},
	);
});

test("rejects READMEs that omit skill links", () => {
	withRepo(
		{
			"README.md": "# Skills\n",
			"skills/lb-example/SKILL.md": validSkill(),
		},
		(root) => {
			const result = validateRepo(root);

			assert.match(
				result.errors.join("\n"),
				/missing skill table link for lb-example/,
			);
		},
	);
});

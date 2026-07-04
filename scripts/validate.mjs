#!/usr/bin/env node
// Validates every skill in skills/ against the Agent Skills spec
// (https://agentskills.io/specification). Zero dependencies.

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_PREFIX = "lb-";
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const FRONTMATTER_FIELD_PATTERN = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/;
const LINE_BREAK_PATTERN = /\r?\n/;
const MAX_BODY_LINES = 500;

let errors = 0;
let warnings = 0;

function error(skill, message) {
	console.error(`✗ ${skill}: ${message}`);
	errors++;
}

function warn(skill, message) {
	console.warn(`⚠ ${skill}: ${message}`);
	warnings++;
}

function parseFrontmatter(content) {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match) return null;
	const fields = {};
	for (const line of match[1].split(LINE_BREAK_PATTERN)) {
		const kv = line.match(FRONTMATTER_FIELD_PATTERN);
		if (kv) fields[kv[1]] = kv[2].trim();
	}
	return { fields, raw: match[0], body: content.slice(match[0].length) };
}

if (!existsSync(skillsDir)) {
	console.error("✗ skills/ directory not found");
	process.exit(1);
}

const dirs = readdirSync(skillsDir).filter((entry) => {
	if (entry.startsWith(".")) return false;
	return statSync(join(skillsDir, entry)).isDirectory();
});

for (const dir of dirs) {
	const skillPath = join(skillsDir, dir, "SKILL.md");
	if (!existsSync(skillPath)) {
		error(dir, "missing SKILL.md");
		continue;
	}

	const content = readFileSync(skillPath, "utf8");
	const parsed = parseFrontmatter(content);
	if (!parsed) {
		error(dir, "missing YAML frontmatter (must start with ---)");
		continue;
	}

	const { fields, body } = parsed;

	if (!fields.name) {
		error(dir, "frontmatter missing required field: name");
	} else {
		if (fields.name !== dir) {
			error(dir, `name "${fields.name}" does not match directory name "${dir}"`);
		}
		if (!NAME_PATTERN.test(fields.name)) {
			error(dir, `name "${fields.name}" must be lowercase letters, numbers, and single hyphens`);
		}
		if (fields.name.length > 64) {
			error(dir, `name exceeds 64 characters (${fields.name.length})`);
		}
		if (!fields.name.startsWith(SKILL_PREFIX)) {
			error(dir, `name "${fields.name}" must start with "${SKILL_PREFIX}" (repo convention: all skills are prefixed to avoid collisions)`);
		}
	}

	if (!fields.description) {
		error(dir, "frontmatter missing required field: description");
	} else {
		if (fields.description.length > 1024) {
			error(dir, `description exceeds 1024 characters (${fields.description.length})`);
		}
		if (fields.description.length > 500) {
			warn(dir, `description is ${fields.description.length} chars — aim for under 500`);
		}
	}

	if (fields.compatibility && fields.compatibility.length > 500) {
		error(dir, `compatibility exceeds 500 characters (${fields.compatibility.length})`);
	}

	const bodyLines = body.split("\n").length;
	if (bodyLines > MAX_BODY_LINES) {
		warn(dir, `SKILL.md body is ${bodyLines} lines — spec recommends under ${MAX_BODY_LINES}; move detail into references/`);
	}
}

console.log(
	`\nChecked ${dirs.length} skill(s): ${errors} error(s), ${warnings} warning(s)`,
);
process.exit(errors > 0 ? 1 : 0);

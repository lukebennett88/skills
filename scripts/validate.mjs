#!/usr/bin/env node
// Validates skills against the Agent Skills spec and repo conventions.
// Zero dependencies.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_PREFIX = 'lb-';
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const FRONTMATTER_FIELD_PATTERN = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/;
const YAML_FIELD_PATTERN = /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/;
const LINE_BREAK_PATTERN = /\r?\n/;
const MAX_BODY_LINES = 500;
const ALLOWED_FRONTMATTER_FIELDS = new Set(['name', 'description', 'compatibility', 'metadata']);
const BODY_TRIGGER_HEADING_PATTERN = /^##\s+When(?:\s+to)?\s+Use(?:\s+This\s+Skill)?\s*$/im;
const REQUIRED_AGENT_FIELDS = ['display_name', 'short_description', 'default_prompt'];
const ALLOWED_AGENT_FIELDS = new Set(REQUIRED_AGENT_FIELDS);

export function parseFrontmatter(content) {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match) return null;

	const fields = {};
	const fieldLines = [];

	for (const line of match[1].split(LINE_BREAK_PATTERN)) {
		const kv = line.match(FRONTMATTER_FIELD_PATTERN);
		if (kv) {
			fields[kv[1]] = kv[2].trim();
			fieldLines.push(kv[1]);
		}
	}

	return {
		fields,
		fieldLines,
		raw: match[0],
		body: content.slice(match[0].length),
	};
}

function parseYamlFields(content) {
	const fields = {};
	const fieldLines = [];

	const lines = content.split(LINE_BREAK_PATTERN);

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const kv = line.match(YAML_FIELD_PATTERN);
		if (kv) {
			const [, key, rawValue] = kv;
			fieldLines.push(key);

			if (rawValue.trim() === '|') {
				const blockLines = [];

				while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) {
					i += 1;
					blockLines.push(lines[i].trim());
				}

				fields[key] = blockLines.join('\n');
			} else {
				fields[key] = rawValue.trim();
			}
		}
	}

	return { fields, fieldLines };
}

function formatIssue(skill, message) {
	return `${skill}: ${message}`;
}

function validateSkill({ dir, skillPath, errors, warnings }) {
	if (!existsSync(skillPath)) {
		errors.push(formatIssue(dir, 'missing SKILL.md'));
		return;
	}

	const parsed = parseFrontmatter(readFileSync(skillPath, 'utf8'));
	if (!parsed) {
		errors.push(formatIssue(dir, 'SKILL.md missing frontmatter'));
		return;
	}

	const { fields, fieldLines, body } = parsed;

	for (const field of fieldLines) {
		if (!ALLOWED_FRONTMATTER_FIELDS.has(field)) {
			errors.push(formatIssue(dir, `frontmatter field "${field}" not allowed`));
		}
	}

	if (!fields.name) {
		errors.push(formatIssue(dir, 'frontmatter missing required field: name'));
	} else {
		if (fields.name !== dir) {
			errors.push(formatIssue(dir, `name "${fields.name}" does not match directory name "${dir}"`));
		}
		if (!NAME_PATTERN.test(fields.name)) {
			errors.push(
				formatIssue(
					dir,
					`name "${fields.name}" must use lowercase letters, numbers, and single hyphens`,
				),
			);
		}
		if (fields.name.length > 64) {
			errors.push(formatIssue(dir, `name exceeds 64 characters (${fields.name.length})`));
		}
		if (!fields.name.startsWith(SKILL_PREFIX)) {
			errors.push(formatIssue(dir, `name "${fields.name}" must start with "${SKILL_PREFIX}"`));
		}
	}

	if (!fields.description) {
		errors.push(formatIssue(dir, 'frontmatter missing required field: description'));
	} else {
		if (!fields.description.startsWith('Use when')) {
			errors.push(formatIssue(dir, 'description must start with "Use when"'));
		}
		if (fields.description.length > 1024) {
			errors.push(
				formatIssue(dir, `description exceeds 1024 characters (${fields.description.length})`),
			);
		}
		if (fields.description.length > 500) {
			warnings.push(
				formatIssue(dir, `description is ${fields.description.length} chars; aim for under 500`),
			);
		}
	}

	if (fields.compatibility && fields.compatibility.length > 500) {
		errors.push(
			formatIssue(dir, `compatibility exceeds 500 characters (${fields.compatibility.length})`),
		);
	}

	if (BODY_TRIGGER_HEADING_PATTERN.test(body)) {
		errors.push(formatIssue(dir, 'move "When to Use" guidance into the description'));
	}

	const bodyLines = body.split('\n').length;
	if (bodyLines > MAX_BODY_LINES) {
		warnings.push(
			formatIssue(
				dir,
				`SKILL.md body is ${bodyLines} lines; spec recommends under ${MAX_BODY_LINES}; move detail into references/`,
			),
		);
	}
}

function validateAgentMetadata({ dir, agentPath, errors }) {
	if (!existsSync(agentPath)) {
		errors.push(formatIssue(dir, 'missing agents/openai.yaml'));
		return;
	}

	const { fields, fieldLines } = parseYamlFields(readFileSync(agentPath, 'utf8'));

	for (const field of fieldLines) {
		if (!ALLOWED_AGENT_FIELDS.has(field)) {
			errors.push(formatIssue(dir, `agents/openai.yaml field "${field}" not allowed`));
		}
	}

	for (const field of REQUIRED_AGENT_FIELDS) {
		if (!fields[field]) {
			errors.push(formatIssue(dir, `agents/openai.yaml missing required field: ${field}`));
		}
	}

	if (fields.display_name && fields.display_name.length > 80) {
		errors.push(
			formatIssue(dir, `display_name exceeds 80 characters (${fields.display_name.length})`),
		);
	}

	if (fields.short_description && fields.short_description.length > 160) {
		errors.push(
			formatIssue(
				dir,
				`short_description exceeds 160 characters (${fields.short_description.length})`,
			),
		);
	}

	if (fields.default_prompt && !fields.default_prompt.includes(dir)) {
		errors.push(formatIssue(dir, `default_prompt must include "${dir}"`));
	}
}

function validateReadme({ rootDir, dirs, errors }) {
	const readmePath = join(rootDir, 'README.md');
	if (!existsSync(readmePath)) {
		errors.push('README.md: missing file');
		return;
	}

	const readme = readFileSync(readmePath, 'utf8');
	for (const dir of dirs) {
		if (!readme.includes(`skills/${dir}/SKILL.md`)) {
			errors.push(formatIssue(dir, `missing skill table link for ${dir}`));
		}
	}
}

export function validateRepo(rootDir = defaultRoot) {
	const errors = [];
	const warnings = [];
	const skillsDir = join(rootDir, 'skills');

	if (!existsSync(skillsDir)) {
		return {
			errors: ['skills/ directory not found'],
			warnings,
			checked: 0,
		};
	}

	const dirs = readdirSync(skillsDir).filter((entry) =>
		statSync(join(skillsDir, entry)).isDirectory(),
	);

	for (const dir of dirs) {
		validateSkill({
			dir,
			skillPath: join(skillsDir, dir, 'SKILL.md'),
			errors,
			warnings,
		});
		validateAgentMetadata({
			dir,
			agentPath: join(skillsDir, dir, 'agents', 'openai.yaml'),
			errors,
		});
	}

	validateReadme({ rootDir, dirs, errors });

	return {
		errors,
		warnings,
		checked: dirs.length,
	};
}

function runCli() {
	const result = validateRepo(defaultRoot);

	for (const error of result.errors) {
		console.error(`x ${error}`);
	}

	for (const warning of result.warnings) {
		console.warn(`! ${warning}`);
	}

	console.log(
		`\nChecked ${result.checked} skill(s): ${result.errors.length} error(s), ${result.warnings.length} warning(s)`,
	);

	process.exit(result.errors.length > 0 ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	runCli();
}

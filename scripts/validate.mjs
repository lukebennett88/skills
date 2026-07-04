#!/usr/bin/env node

// @ts-check

// Validates skills against the Agent Skills spec and repo conventions.
// Zero dependencies.
import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @typedef {Record<string, string>} FrontmatterFields
 * @typedef {{ fields: FrontmatterFields, body: string }} ParsedFrontmatter
 * @typedef {{ dir: string, skillPath: string, errors: string[], warnings: string[] }} SkillValidation
 * @typedef {{ rootDir: string, dirs: string[], errors: string[] }} ReadmeValidation
 * @typedef {{ errors: string[], warnings: string[], checked: number }} ValidationResult
 */

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_PREFIX = "lb-";
const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const FRONTMATTER_FIELD_PATTERN = /^([A-Za-z][A-Za-z0-9-]*):\s*(.*)$/;
const LINE_BREAK_PATTERN = /\r?\n/;
const MAX_BODY_LINES = 500;
const ALLOWED_FRONTMATTER_FIELDS = new Set([
	"name",
	"description",
	"compatibility",
	"metadata",
	"allowed-tools",
]);
// Trigger-shaped headings at any level: "When to Use", "When not to use",
// "When to reach for this", "Triggers", "Use this when...".
const BODY_TRIGGER_HEADING_PATTERN =
	/^#{2,}\s+(?:when\s+(?:to\s+|not\s+to\s+)?(?:use|reach|apply|invoke)\b.*|triggers?|use\s+this\s+when\b.*)\s*$/im;
const CODE_FENCE_PATTERN = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm;
const BLOCK_SCALAR_PATTERN = /^[|>][+-]?$/;

/**
 * @param {string} content
 * @returns {ParsedFrontmatter | null}
 */
function parseFrontmatter(content) {
	const match = content.match(FRONTMATTER_PATTERN);
	if (!match) return null;

	/** @type {FrontmatterFields} */
	const fields = {};
	const lines = match[1].split(LINE_BREAK_PATTERN);

	for (let i = 0; i < lines.length; i += 1) {
		const kv = lines[i].match(FRONTMATTER_FIELD_PATTERN);
		if (!kv) continue;

		const raw = kv[2].trim();
		const value = (() => {
			if (BLOCK_SCALAR_PATTERN.test(raw)) {
				const block = [];
				while (i + 1 < lines.length && /^\s/.test(lines[i + 1])) {
					i += 1;
					block.push(lines[i].trim());
				}
				return block.join("\n");
			}
			if (raw.length >= 2 && /^(["']).*\1$/.test(raw)) return raw.slice(1, -1);

			return raw;
		})();

		fields[kv[1]] = value;
	}

	return { fields, body: content.slice(match[0].length) };
}

/**
 * @param {string} skill
 * @param {string} message
 * @returns {string}
 */
function formatIssue(skill, message) {
	return `${skill}: ${message}`;
}

/**
 * @param {SkillValidation} validation
 */
function validateSkill({ dir, skillPath, errors, warnings }) {
	if (!existsSync(skillPath)) {
		errors.push(formatIssue(dir, "missing SKILL.md"));
		return;
	}

	const parsed = parseFrontmatter(readFileSync(skillPath, "utf8"));
	if (!parsed) {
		errors.push(formatIssue(dir, "SKILL.md missing frontmatter"));
		return;
	}

	const { fields, body } = parsed;

	for (const field of Object.keys(fields)) {
		if (!ALLOWED_FRONTMATTER_FIELDS.has(field)) {
			errors.push(formatIssue(dir, `frontmatter field "${field}" not allowed`));
		}
	}

	if (!fields.name) {
		errors.push(formatIssue(dir, "frontmatter missing required field: name"));
	} else {
		if (fields.name !== dir) {
			errors.push(
				formatIssue(
					dir,
					`name "${fields.name}" does not match directory name "${dir}"`,
				),
			);
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
			errors.push(
				formatIssue(dir, `name exceeds 64 characters (${fields.name.length})`),
			);
		}
		if (!fields.name.startsWith(SKILL_PREFIX)) {
			errors.push(
				formatIssue(
					dir,
					`name "${fields.name}" must start with "${SKILL_PREFIX}"`,
				),
			);
		}
	}

	if (!fields.description) {
		errors.push(
			formatIssue(dir, "frontmatter missing required field: description"),
		);
	} else {
		if (!fields.description.startsWith("Use when")) {
			errors.push(formatIssue(dir, 'description must start with "Use when"'));
		}
		if (fields.description.length > 1024) {
			errors.push(
				formatIssue(
					dir,
					`description exceeds 1024 characters (${fields.description.length})`,
				),
			);
		}
		if (fields.description.length > 500) {
			warnings.push(
				formatIssue(
					dir,
					`description is ${fields.description.length} chars; aim for under 500`,
				),
			);
		}
	}

	if (fields.compatibility && fields.compatibility.length > 500) {
		errors.push(
			formatIssue(
				dir,
				`compatibility exceeds 500 characters (${fields.compatibility.length})`,
			),
		);
	}

	if (BODY_TRIGGER_HEADING_PATTERN.test(body.replace(CODE_FENCE_PATTERN, ""))) {
		errors.push(
			formatIssue(dir, 'move "When to Use" guidance into the description'),
		);
	}

	const bodyLines = body.split("\n").length;
	if (bodyLines > MAX_BODY_LINES) {
		warnings.push(
			formatIssue(
				dir,
				`SKILL.md body is ${bodyLines} lines; spec recommends under ${MAX_BODY_LINES}; move detail into references/`,
			),
		);
	}
}

/**
 * @param {ReadmeValidation} validation
 */
function validateReadme({ rootDir, dirs, errors }) {
	const readmePath = join(rootDir, "README.md");
	if (!existsSync(readmePath)) {
		errors.push("README.md: missing file");
		return;
	}

	const readme = readFileSync(readmePath, "utf8");
	for (const dir of dirs) {
		if (!readme.includes(`skills/${dir}/SKILL.md`)) {
			errors.push(formatIssue(dir, `missing skill table link for ${dir}`));
		}
	}
}

/**
 * @param {string} [rootDir]
 * @returns {ValidationResult}
 */
export function validateRepo(rootDir = defaultRoot) {
	/** @type {string[]} */
	const errors = [];
	/** @type {string[]} */
	const warnings = [];
	const skillsDir = join(rootDir, "skills");

	if (!existsSync(skillsDir)) {
		return {
			errors: ["skills/ directory not found"],
			warnings,
			checked: 0,
		};
	}

	const dirs = readdirSync(skillsDir).filter((entry) => {
		if (entry.startsWith(".")) return false;
		return statSync(join(skillsDir, entry)).isDirectory();
	});

	for (const dir of dirs) {
		validateSkill({
			dir,
			skillPath: join(skillsDir, dir, "SKILL.md"),
			errors,
			warnings,
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

function isCliRun() {
	if (!process.argv[1]) return false;
	try {
		return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
	} catch {
		return false;
	}
}

if (isCliRun()) {
	runCli();
}

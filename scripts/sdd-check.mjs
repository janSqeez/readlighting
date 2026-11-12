#!/usr/bin/env node
// Spec traceability check: every acceptance criterion (AC-NNN-xx) of a spec whose status is
// "Tests Approved" or "Implemented" must appear in at least one test file.
// Test dirs / file pattern come from .claude/sdd.config.json. Use in CI and pre-push.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const cfg = JSON.parse(readFileSync(join(ROOT, '.claude', 'sdd.config.json'), 'utf8'));
const CHECKED = new Set(['Tests Approved', 'Implemented']);
const TEST_FILE = new RegExp(cfg.testFilePattern);
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'target', '.venv', '__pycache__']);

function walk(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).flatMap((name) => {
        if (SKIP.has(name)) return [];
        const path = join(dir, name);
        return statSync(path).isDirectory() ? walk(path) : [path];
    });
}

const testText = cfg.testDirs
    .flatMap((d) => walk(join(ROOT, d)))
    .filter((f) => TEST_FILE.test(f))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');

const specsDir = join(ROOT, 'specs');
const missing = [];
let checked = 0;

for (const name of readdirSync(specsDir).filter((n) => /^\d{3}-/.test(n))) {
    const file = join(specsDir, name, 'spec.md');
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    const status = /\*\*Status:\*\*\s*([^\n]+)/.exec(text)?.[1].trim();
    if (!CHECKED.has(status)) {
        console.log(`skip  ${name} (status: ${status ?? 'unknown'})`);
        continue;
    }
    const ids = [...new Set(text.match(/\bAC-\d{3}-\d{2}\b/g) ?? [])];
    if (ids.length === 0) missing.push(`${name}: no acceptance criteria (AC-NNN-xx) found`);
    for (const id of ids) {
        checked++;
        if (!testText.includes(id)) missing.push(`${name}: ${id} has no test`);
    }
    console.log(`check ${name} (${status}, ${ids.length} AC)`);
}

if (missing.length > 0) {
    console.error('\nSpec traceability FAILED:\n' + missing.map((m) => `  - ${m}`).join('\n'));
    process.exit(1);
}
console.log(`\nSpec traceability OK (${checked} acceptance criteria covered).`);

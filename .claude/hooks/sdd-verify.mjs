#!/usr/bin/env node
// Stop hook for /sdd-implement. Active only while `.claude/implementing` exists
// (written by the skill, content: {"spec":"009","blocks":0}).
// Runs the commands from .claude/sdd.config.json:
//   specTestCmd (with {AC} = "AC-NNN-") and every entry of verifyCmds.
// Any failure → exit 2: Claude must keep working (stderr is fed back).
// After maxIterations blocked attempts the hook lets Claude stop so it can ask the human.
// All green → marker removed, exit 0.
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const marker = join(root, '.claude', 'implementing');
if (!existsSync(marker)) process.exit(0);

const cfg = JSON.parse(readFileSync(join(root, '.claude', 'sdd.config.json'), 'utf8'));
const max = cfg.maxIterations ?? 5;
const state = JSON.parse(readFileSync(marker, 'utf8'));
const spec = String(state.spec).padStart(3, '0');

const run = (cmd) => {
    const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const tail = (s) => s.split('\n').slice(-25).join('\n');

const failures = [];
if (cfg.specTestCmd) {
    const r = run(cfg.specTestCmd.replaceAll('{AC}', `AC-${spec}-`));
    if (!r.ok) failures.push(`spec ${spec} tests failed:\n${tail(r.out)}`);
}
for (const cmd of cfg.verifyCmds ?? []) {
    const r = run(cmd);
    if (!r.ok) failures.push(`\`${cmd}\` failed:\n${tail(r.out)}`);
}

if (failures.length === 0) {
    rmSync(marker, { force: true });
    console.log(`sdd-implement: spec ${spec} green, verification passed.`);
    process.exit(0);
}

state.blocks = (state.blocks ?? 0) + 1;
writeFileSync(marker, JSON.stringify(state));
const report = failures.map((f) => `  - ${f}`).join('\n');

if (state.blocks >= max) {
    console.log(`sdd-implement: ${state.blocks} iterations without green. STOP and ask the human — do not weaken or edit frozen tests.\n${report}`);
    process.exit(0);
}
console.error(`sdd-implement (spec ${spec}, iteration ${state.blocks}/${max}): not green yet. Fix the CODE, never the frozen tests.\n${report}`);
process.exit(2);

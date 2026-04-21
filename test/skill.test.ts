import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const CLI = join(import.meta.dirname, '..', 'dist', 'cli.js');
let testDir: string;

beforeEach(() => {
  testDir = join(tmpdir(), `llm-wiki-skill-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('skill command', () => {
  it('should install one skill type into the selected agent directory', () => {
    execSync(`node ${CLI} skill install --dir "${testDir}" --type base --claude`, { cwd: testDir });

    expect(existsSync(join(testDir, '.claude/skills/brain-ops/SKILL.md'))).toBe(true);
    expect(existsSync(join(testDir, '.claude/skills/query/SKILL.md'))).toBe(true);
    expect(existsSync(join(testDir, '.agents/skills'))).toBe(false);
  });

  it('should show a skill by name and type', () => {
    const output = execSync(`node ${CLI} skill show brain-ops --type base`, { cwd: testDir, encoding: 'utf-8' });
    expect(output).toContain('# Brain Ops');
  });

  it('should install the expected skill content', () => {
    execSync(`node ${CLI} skill install --dir "${testDir}" --type base --codex`, { cwd: testDir });
    const installed = readFileSync(join(testDir, '.agents/skills/research/SKILL.md'), 'utf-8');
    expect(installed).toContain('## /research <topic>');
  });
});

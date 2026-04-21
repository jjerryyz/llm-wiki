import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CLI = join(import.meta.dirname, '..', 'dist', 'cli.js');
const SKILLS = ['brain-ops', 'ingest', 'lint', 'query', 'research'];
let testDir: string;

beforeEach(() => {
  testDir = join(import.meta.dirname, '.tmp', `llm-wiki-init-${Date.now()}`);
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('init command', () => {
  it('should create vault structure', () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    expect(existsSync(join(testDir, 'wiki'))).toBe(true);
    expect(existsSync(join(testDir, 'sources'))).toBe(true);
    expect(existsSync(join(testDir, 'wiki-purpose.md'))).toBe(true);
    expect(existsSync(join(testDir, 'wiki-schema.md'))).toBe(true);
    expect(existsSync(join(testDir, 'wiki-log.md'))).toBe(true);
    expect(existsSync(join(testDir, '.llm-wiki/config.toml'))).toBe(true);
    // v0.4.2 rename: old unprefixed names must not be created
    expect(existsSync(join(testDir, 'purpose.md'))).toBe(false);
    expect(existsSync(join(testDir, 'schema.md'))).toBe(false);
    expect(existsSync(join(testDir, 'log.md'))).toBe(false);
  });

  it('should generate agent bootstrap files', () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    expect(existsSync(join(testDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(testDir, 'AGENTS.md'))).toBe(true);
  });

  it('should auto-install skills to both agent dirs', () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    for (const skill of SKILLS) {
      const claudeSkill = join(testDir, '.claude/skills', skill, 'SKILL.md');
      const agentsSkill = join(testDir, '.agents/skills', skill, 'SKILL.md');
      expect(existsSync(claudeSkill)).toBe(true);
      expect(existsSync(agentsSkill)).toBe(true);

      const claudeContent = readFileSync(claudeSkill, 'utf-8');
      const agentsContent = readFileSync(agentsSkill, 'utf-8');
      expect(claudeContent.length).toBeGreaterThan(100);
      expect(claudeContent).toEqual(agentsContent);
    }
  });

  it('should not clobber pre-existing customized skill files', () => {
    const claudeSkillDir = join(testDir, '.claude/skills/brain-ops');
    mkdirSync(claudeSkillDir, { recursive: true });
    const customContent = '# My Custom Skill\n\nDo not overwrite me.\n';
    writeFileSync(join(claudeSkillDir, 'SKILL.md'), customContent);

    execSync(`node ${CLI} init`, { cwd: testDir });

    expect(readFileSync(join(claudeSkillDir, 'SKILL.md'), 'utf-8')).toEqual(customContent);
    // Fresh dir still gets the bundled skill
    expect(existsSync(join(testDir, '.agents/skills/brain-ops/SKILL.md'))).toBe(true);
    expect(existsSync(join(testDir, '.claude/skills/query/SKILL.md'))).toBe(true);
  });

  it('should not overwrite existing files', () => {
    execSync(`node ${CLI} init`, { cwd: testDir });
    // Should fail if already initialized
    expect(() => execSync(`node ${CLI} init`, { cwd: testDir, stdio: 'pipe' })).toThrow();
  });
});

import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getSkillsDir(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const packageRoot = dirname(dirname(currentFile));
  return join(packageRoot, 'skills');
}

export interface SkillDefinition {
  type: string;
  name: string;
  sourceFile: string;
}

function listSubdirectories(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export function listSkillTypes(skillsDir = getSkillsDir()): string[] {
  if (!existsSync(skillsDir)) return [];
  return listSubdirectories(skillsDir);
}

export function listSkills(skillsDir = getSkillsDir(), type?: string): SkillDefinition[] {
  const types = type ? [type] : listSkillTypes(skillsDir);
  const skills: SkillDefinition[] = [];

  for (const skillType of types) {
    const typeDir = join(skillsDir, skillType);
    if (!existsSync(typeDir)) continue;

    for (const skillName of listSubdirectories(typeDir)) {
      const sourceFile = join(typeDir, skillName, 'SKILL.md');
      if (!existsSync(sourceFile)) continue;
      skills.push({ type: skillType, name: skillName, sourceFile });
    }
  }

  return skills.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.name.localeCompare(b.name);
  });
}

export function findSkill(name: string, type?: string, skillsDir = getSkillsDir()): SkillDefinition[] {
  return listSkills(skillsDir, type).filter(skill => skill.name === name);
}

export interface InstallResult {
  installed: string[];
  skipped: string[];
}

export interface InstallSkillsOptions {
  overwrite?: boolean;
  type?: string;
}

export function installSkillsTo(targetDir: string, options: InstallSkillsOptions = {}): InstallResult {
  const { overwrite = true, type } = options;
  const skillsDir = getSkillsDir();
  if (!existsSync(skillsDir)) {
    throw new Error('Skills directory not found. Package may be corrupted.');
  }

  if (type && !existsSync(join(skillsDir, type))) {
    throw new Error(`Skill type "${type}" not found.`);
  }

  mkdirSync(targetDir, { recursive: true });
  const skills = listSkills(skillsDir, type);
  const installed: string[] = [];
  const skipped: string[] = [];

  for (const skill of skills) {
    const label = `${skill.type}/${skill.name}`;
    const dest = join(targetDir, skill.name, 'SKILL.md');
    if (!overwrite && existsSync(dest)) {
      skipped.push(label);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(skill.sourceFile, dest);
    installed.push(label);
  }

  return { installed, skipped };
}

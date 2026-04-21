import { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { findSkill, getSkillsDir, listSkills, listSkillTypes, installSkillsTo } from '../lib/skills.js';

export const skillCommand = new Command('skill')
  .description('Manage AI agent skills');

skillCommand
  .command('install')
  .description('Install/upgrade skills in your AI agent workspace')
  .option('--claude', 'install to .claude/skills/ only')
  .option('--codex', 'install to .agents/skills/ only')
  .option('--type <type>', 'install only one skill type')
  .option('--dir <path>', 'workspace directory (default: cwd)')
  .action((opts: { claude?: boolean; codex?: boolean; dir?: string; type?: string }) => {
    const workspace = opts.dir || process.cwd();
    const both = !opts.claude && !opts.codex;
    const availableTypes = listSkillTypes();

    if (opts.type && !availableTypes.includes(opts.type)) {
      console.error(`Error: Skill type "${opts.type}" not found.`);
      console.error(`Available types: ${availableTypes.join(', ')}`);
      process.exit(1);
    }

    const summarySuffix = opts.type ? ` (${opts.type})` : '';

    if (both || opts.claude) {
      const dir = join(workspace, '.claude', 'skills');
      const { installed } = installSkillsTo(dir, { type: opts.type });
      console.log(`Installed ${installed.length} skill${installed.length === 1 ? '' : 's'}${summarySuffix} to ${dir}/`);
      for (const skill of installed) console.log(`  ${skill}`);
    }

    if (both || opts.codex) {
      const dir = join(workspace, '.agents', 'skills');
      const { installed } = installSkillsTo(dir, { type: opts.type });
      if (both) console.log('');
      console.log(`Installed ${installed.length} skill${installed.length === 1 ? '' : 's'}${summarySuffix} to ${dir}/`);
      for (const skill of installed) console.log(`  ${skill}`);
    }
  });

skillCommand
  .command('show')
  .description('Print skill content to stdout')
  .argument('<name>', 'skill name')
  .option('--type <type>', 'show one skill type only')
  .action((name: string, opts: { type?: string }) => {
    const skillsDir = getSkillsDir();
    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    const matches = findSkill(name, opts.type, skillsDir);
    if (matches.length === 0) {
      console.error(`Error: Skill "${name}" not found.`);
      console.error(`Available: ${listSkills(skillsDir).map(skill => `${skill.type}/${skill.name}`).join(', ')}`);
      process.exit(1);
    }

    if (matches.length > 1) {
      console.error(`Error: Skill "${name}" is ambiguous. Use --type to choose one.`);
      console.error(`Matches: ${matches.map(skill => `${skill.type}/${skill.name}`).join(', ')}`);
      process.exit(1);
    }

    console.log(readFileSync(matches[0].sourceFile, 'utf-8'));
  });

skillCommand
  .command('list')
  .description('List all available skills')
  .action(() => {
    const skillsDir = getSkillsDir();
    if (!existsSync(skillsDir)) {
      console.error('Error: Skills directory not found. Package may be corrupted.');
      process.exit(1);
    }

    const types = listSkillTypes(skillsDir);
    console.log('Available skill types:');
    for (const type of types) {
      console.log(`  ${type}`);
    }
    console.log('');
    console.log('Available skills:');
    for (const type of types) {
      console.log(`  ${type}/`);
      for (const skill of listSkills(skillsDir, type)) {
        console.log(`    ${skill.name}`);
      }
    }
    console.log('');
    console.log('Install all:          llm-wiki skill install');
    console.log('Install one type:     llm-wiki skill install --type base');
    console.log('Show one:             llm-wiki skill show <name>');
    console.log('Show one by type:     llm-wiki skill show <name> --type base');
  });

skillCommand.action(() => {
  skillCommand.commands.find(c => c.name() === 'list')!.parse([], { from: 'user' });
});

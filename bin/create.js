#!/usr/bin/env node
import { intro, outro, text, select, confirm, isCancel, cancel, spinner, note } from '@clack/prompts';
import pc from 'picocolors';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { listStacks, loadStack, mergeManifests } from '../lib/stack.js';
import { copyTree, appendFile } from '../lib/copy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CORE = join(ROOT, 'core');
const STACKS = join(ROOT, 'stacks');

function bail(msg) {
  cancel(msg);
  process.exit(0);
}

async function main() {
  intro(pc.bgMagenta(pc.black(' create-claude-workflow ')));

  const { bases, overlays } = await listStacks(STACKS);

  const projectName = await text({
    message: 'Project name (or "." to use current directory)',
    placeholder: 'my-project',
    validate: (v) => (!v ? 'required' : undefined),
  });
  if (isCancel(projectName)) bail('Cancelled.');

  const baseChoice = await select({
    message: 'Base stack',
    options: bases.map((b) => ({
      value: b.name,
      label: b.manifest.label ?? b.name,
      hint: b.manifest.hint,
    })),
  });
  if (isCancel(baseChoice)) bail('Cancelled.');

  let overlayChoice = 'none';
  if (overlays.length > 0) {
    overlayChoice = await select({
      message: 'Frontend overlay (optional)',
      options: [
        { value: 'none', label: 'None' },
        ...overlays.map((o) => ({
          value: o.name,
          label: o.manifest.label ?? o.name,
          hint: o.manifest.hint,
        })),
      ],
    });
    if (isCancel(overlayChoice)) bail('Cancelled.');
  }

  const initGit = await confirm({ message: 'Initialize git repository?', initialValue: true });
  if (isCancel(initGit)) bail('Cancelled.');

  const seedMemory = await confirm({ message: 'Seed memory/ directory?', initialValue: true });
  if (isCancel(seedMemory)) bail('Cancelled.');

  const targetDir = projectName === '.' ? process.cwd() : resolve(process.cwd(), projectName);
  await mkdir(targetDir, { recursive: true });

  const baseStack = await loadStack(STACKS, baseChoice);
  const selectedStacks = [baseStack];
  if (overlayChoice !== 'none') selectedStacks.push(await loadStack(STACKS, overlayChoice));

  const merged = mergeManifests(selectedStacks);

  // Validate overlay compatibility.
  for (const s of selectedStacks.slice(1)) {
    const requires = s.manifest.requires ?? [];
    if (requires.length && !requires.includes(baseStack.name)) {
      bail(`Overlay "${s.name}" requires one of: ${requires.join(', ')} (got "${baseStack.name}")`);
    }
  }

  const context = {
    project: {
      name: projectName === '.' ? targetDir.split('/').pop() : projectName,
    },
    stack: {
      base: baseStack.name,
      overlay: overlayChoice === 'none' ? null : overlayChoice,
      label: merged.label ?? baseStack.manifest.label ?? baseStack.name,
    },
    cmd: merged.commands,
    layout: merged.layout ?? 'src/',
    testFramework: merged.testFramework ?? 'unspecified',
    // Convenience: formatted bash block with all commands.
    cmdBlock: formatCommandBlock(merged.commands),
  };

  const s = spinner();
  s.start('Copying agnostic core');
  await copyTree(CORE, targetDir, context);
  s.stop('Core copied.');

  for (const stack of selectedStacks) {
    s.start(`Applying stack: ${stack.name}`);
    const templatesDir = join(stack.dir, 'templates');
    if (existsSync(templatesDir)) {
      await copyTree(templatesDir, targetDir, context);
    }
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(targetDir, '.claude', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }
    const gitignore = join(stack.dir, 'gitignore.append');
    if (existsSync(gitignore)) {
      await appendFile(gitignore, join(targetDir, '.gitignore'));
    }
    s.stop(`Applied: ${stack.name}`);
  }

  // Write a resolved stack.json to the project so the user can see effective config.
  await writeFile(
    join(targetDir, '.claude', 'stack.resolved.json'),
    JSON.stringify({ stacks: selectedStacks.map((s) => s.name), ...merged }, null, 2),
  );

  if (initGit) {
    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      execSync('git add .', { cwd: targetDir, stdio: 'ignore' });
      execSync('git commit -m "chore: bootstrap claude workflow"', {
        cwd: targetDir,
        stdio: 'ignore',
      });
    } catch {
      note('git init or initial commit failed — you can do it manually.', 'warn');
    }
  }

  if (!seedMemory) {
    // The core/ always seeds memory/; if the user said no, remove it.
    try {
      execSync(`rm -rf "${join(targetDir, 'memory')}"`);
    } catch {}
  }

  note(
    [
      `Stack: ${pc.cyan(context.stack.base)}${context.stack.overlay ? ' + ' + pc.cyan(context.stack.overlay) : ''}`,
      `Path:  ${pc.dim(targetDir)}`,
      '',
      'Next:',
      `  cd ${projectName === '.' ? '.' : projectName}`,
      `  cat CLAUDE.md`,
    ].join('\n'),
    'Done',
  );

  outro(pc.green('Happy hacking.'));
}

function formatCommandBlock(cmds) {
  const entries = Object.entries(cmds ?? {});
  if (!entries.length) return '# (no commands defined for this stack)';
  const pad = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([k, v]) => `${k.padEnd(pad)}  # ${v}`).join('\n');
}

main().catch((err) => {
  console.error(pc.red('Error:'), err.message);
  process.exit(1);
});

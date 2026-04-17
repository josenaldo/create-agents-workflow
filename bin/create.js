#!/usr/bin/env node
import { intro, outro, text, select, confirm, isCancel, cancel, spinner, note } from '@clack/prompts';
import pc from 'picocolors';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { listStacks, loadStack, mergeManifests } from '../lib/stack.js';
import { copyTree, appendFile } from '../lib/copy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CORE = join(ROOT, 'core');
const STACKS = join(ROOT, 'stacks');

// ─── CLI argument parsing ──────────────────────────────────────────────────────

const { values: flags, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    yes: { type: 'boolean', short: 'y', default: false },
    stack: { type: 'string', default: '' },
    overlay: { type: 'string', default: '' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (flags.help) {
  console.log(`
${pc.bold('create-agents-workflow')} — scaffold a multi-agent Claude Code / Codex / Gemini / Copilot / Cursor workflow

${pc.dim('Usage:')}
  npx @josenaldo/create-agents-workflow [project] [options]

${pc.dim('Arguments:')}
  project             Project name or "." for current directory

${pc.dim('Options:')}
  -y, --yes           Accept all defaults (non-interactive)
  --stack <name>      Base stack (skip prompt)
  --overlay <name>    Frontend overlay, or "none" (skip prompt)
  --agents <list>     Comma-separated: claude,codex,gemini,copilot,cursor
                      (default: all)
  --dry-run           Show what would be generated without writing
  -h, --help          Show this help
`);
  process.exit(0);
}

const autoYes = flags.yes;
const dryRun = flags['dry-run'];
const nonInteractive = autoYes || dryRun;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function bail(msg) {
  if (nonInteractive) {
    console.error(pc.red('Error:'), msg);
  } else {
    cancel(msg);
  }
  process.exit(1);
}

function formatCommandBlock(cmds) {
  const entries = Object.entries(cmds ?? {});
  if (!entries.length) return '# (no commands defined for this stack)';
  const pad = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([k, v]) => `${k.padEnd(pad)}  # ${v}`).join('\n');
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!nonInteractive) intro(pc.bgMagenta(pc.black(' create-agents-workflow ')));

  const { bases, overlays } = await listStacks(STACKS);
  const baseNames = bases.map((b) => b.name);
  const overlayNames = overlays.map((o) => o.name);

  // ── Project name ──────────────────────────────────────────────────────────

  let projectName = positionals[0] || '';
  if (!projectName) {
    if (nonInteractive) {
      bail('Project name is required with --yes/--dry-run. Usage: create-claude-workflow <name> --stack <stack> [--yes|--dry-run]');
    }
    projectName = await text({
      message: 'Project name (or "." to use current directory)',
      placeholder: 'my-project',
      validate: (v) => (!v ? 'required' : undefined),
    });
    if (isCancel(projectName)) bail('Cancelled.');
  }

  // ── Base stack ────────────────────────────────────────────────────────────

  let baseChoice = flags.stack;
  if (baseChoice) {
    if (!baseNames.includes(baseChoice)) {
      bail(`Unknown stack "${baseChoice}". Available: ${baseNames.join(', ')}`);
    }
  } else if (nonInteractive) {
    bail(`--stack is required with --yes/--dry-run. Available: ${baseNames.join(', ')}`);
  } else {
    baseChoice = await select({
      message: 'Base stack',
      options: bases.map((b) => ({
        value: b.name,
        label: b.manifest.label ?? b.name,
        hint: b.manifest.hint,
      })),
    });
    if (isCancel(baseChoice)) bail('Cancelled.');
  }

  // ── Overlay ───────────────────────────────────────────────────────────────

  let overlayChoice = flags.overlay || '';
  if (overlayChoice) {
    if (overlayChoice !== 'none' && !overlayNames.includes(overlayChoice)) {
      bail(`Unknown overlay "${overlayChoice}". Available: ${overlayNames.join(', ')}, none`);
    }
  } else if (nonInteractive) {
    overlayChoice = 'none';
  } else if (overlays.length > 0) {
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
  } else {
    overlayChoice = 'none';
  }

  // ── Git / memory (defaults with --yes) ────────────────────────────────────

  let initGit, seedMemory;
  if (nonInteractive) {
    initGit = !dryRun;
    seedMemory = true;
  } else {
    initGit = await confirm({ message: 'Initialize git repository?', initialValue: true });
    if (isCancel(initGit)) bail('Cancelled.');
    seedMemory = await confirm({ message: 'Seed memory/ directory?', initialValue: true });
    if (isCancel(seedMemory)) bail('Cancelled.');
  }

  // ── Resolve stacks and context ────────────────────────────────────────────

  const targetDir = projectName === '.' ? process.cwd() : resolve(process.cwd(), projectName);

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
    cmdBlock: formatCommandBlock(merged.commands),
  };

  // ── Dry-run mode ──────────────────────────────────────────────────────────

  if (dryRun) {
    const lines = [
      `${pc.bold('Dry Run')}`,
      '',
      `Project:  ${pc.cyan(context.project.name)}`,
      `Path:     ${pc.dim(targetDir)}`,
      `Stack:    ${pc.cyan(baseChoice)}${overlayChoice !== 'none' ? ' + ' + pc.cyan(overlayChoice) : ''}`,
      `Layout:   ${context.layout}`,
      `Tests:    ${context.testFramework}`,
      `Git:      ${initGit ? 'yes' : 'no'}`,
      `Memory:   ${seedMemory ? 'yes' : 'no'}`,
      '',
      pc.bold('Commands:'),
      ...Object.entries(merged.commands).map(([k, v]) => `  ${k}: ${v}`),
      '',
      pc.bold('Would generate:'),
      `  CLAUDE.md, AGENTS.md, .gitignore`,
      `  docs/specs/ (WORKFLOW.md, templates)`,
      `  .claude/skills/_core/ (4 core skills)`,
      ...selectedStacks
        .filter((s) => existsSync(join(s.dir, 'skills')))
        .map((s) => `  .claude/skills/${s.name}/ (stack skills)`),
      ...(seedMemory ? ['  memory/MEMORY.md'] : []),
      `  .claude/stack.resolved.json`,
      '',
      pc.yellow('No files were written.'),
    ];
    console.log(lines.join('\n'));
    return;
  }

  // ── Scaffold ──────────────────────────────────────────────────────────────

  await mkdir(targetDir, { recursive: true });

  const log = (msg) => nonInteractive ? console.log(msg) : undefined;
  let s;
  if (!nonInteractive) {
    s = spinner();
    s.start('Copying agnostic core');
  } else {
    log('Copying agnostic core...');
  }
  await copyTree(CORE, targetDir, context);
  if (s) s.stop('Core copied.');

  for (const stack of selectedStacks) {
    if (s) s.start(`Applying stack: ${stack.name}`);
    else log(`Applying stack: ${stack.name}...`);
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
    if (s) s.stop(`Applied: ${stack.name}`);
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
      console.warn(pc.yellow('git init or initial commit failed — you can do it manually.'));
    }
  }

  if (!seedMemory) {
    try {
      execSync(`rm -rf "${join(targetDir, 'memory')}"`);
    } catch {}
  }

  const summary = [
    `Stack: ${pc.cyan(context.stack.base)}${context.stack.overlay ? ' + ' + pc.cyan(context.stack.overlay) : ''}`,
    `Path:  ${pc.dim(targetDir)}`,
    '',
    'Next:',
    `  cd ${projectName === '.' ? '.' : projectName}`,
    `  cat CLAUDE.md`,
  ].join('\n');

  if (nonInteractive) {
    console.log(summary);
    console.log(pc.green('Done.'));
  } else {
    note(summary, 'Done');
    outro(pc.green('Happy hacking.'));
  }
}

main().catch((err) => {
  console.error(pc.red('Error:'), err.message);
  process.exit(1);
});

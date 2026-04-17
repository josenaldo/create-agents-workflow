import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyTree, appendFile } from '../lib/copy.js';
import { loadStack, listStacks, mergeManifests } from '../lib/stack.js';
import { render } from '../lib/renderer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CORE = join(ROOT, 'core');
const STACKS = join(ROOT, 'stacks');

// ─── Helpers ───────────────────────────────────────────────────────────────────

function tmpDir(name) {
  return join('/tmp', `ccw-test-${name}-${Date.now()}`);
}

function formatCommandBlock(cmds) {
  const entries = Object.entries(cmds ?? {});
  if (!entries.length) return '# (no commands defined for this stack)';
  const pad = Math.max(...entries.map(([k]) => k.length));
  return entries.map(([k, v]) => `${k.padEnd(pad)}  # ${v}`).join('\n');
}

async function scaffoldProject(baseName, overlayName = null) {
  const dir = tmpDir(baseName + (overlayName ? `-${overlayName}` : ''));
  await mkdir(dir, { recursive: true });

  const baseStack = await loadStack(STACKS, baseName);
  const selectedStacks = [baseStack];
  if (overlayName) selectedStacks.push(await loadStack(STACKS, overlayName));
  const merged = mergeManifests(selectedStacks);

  const context = {
    project: { name: 'test-project' },
    stack: {
      base: baseStack.name,
      overlay: overlayName,
      label: merged.label ?? baseStack.manifest.label ?? baseStack.name,
    },
    cmd: merged.commands,
    layout: merged.layout ?? 'src/',
    testFramework: merged.testFramework ?? 'unspecified',
    cmdBlock: formatCommandBlock(merged.commands),
  };

  // Copy core
  await copyTree(CORE, dir, context);

  // Apply stacks
  for (const stack of selectedStacks) {
    const templatesDir = join(stack.dir, 'templates');
    if (existsSync(templatesDir)) {
      await copyTree(templatesDir, dir, context);
    }
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(dir, '.claude', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }
    const gitignore = join(stack.dir, 'gitignore.append');
    if (existsSync(gitignore)) {
      await appendFile(gitignore, join(dir, '.gitignore'));
    }
  }

  return { dir, merged, context };
}

async function fileContent(path) {
  return readFile(path, 'utf8');
}

async function dirExists(path) {
  if (!existsSync(path)) return false;
  return (await stat(path)).isDirectory();
}

// ─── Renderer unit tests ──────────────────────────────────────────────────────

describe('renderer', () => {
  it('replaces dotted placeholders', () => {
    const result = render('Hello {{project.name}}!', { project: { name: 'demo' } });
    assert.equal(result, 'Hello demo!');
  });

  it('leaves unknown placeholders untouched', () => {
    const result = render('{{unknown.key}}', {});
    assert.equal(result, '{{unknown.key}}');
  });

  it('replaces cmd placeholders with colon in key', () => {
    const result = render('Run: {{cmd.test:unit}}', { cmd: { 'test:unit': 'npm test' } });
    assert.equal(result, 'Run: npm test');
  });
});

// ─── Stack loader unit tests ──────────────────────────────────────────────────

describe('stack loader', () => {
  it('lists all stacks grouped by kind', async () => {
    const { bases, overlays } = await listStacks(STACKS);
    const baseNames = bases.map((b) => b.name).sort();
    const overlayNames = overlays.map((o) => o.name).sort();
    assert.ok(baseNames.includes('ts-node-npm'));
    assert.ok(baseNames.includes('java-spring-gradle'));
    assert.ok(baseNames.includes('python-uv'));
    assert.ok(baseNames.includes('go'));
    assert.ok(overlayNames.includes('react-mantine'));
    assert.ok(overlayNames.includes('react-mui'));
  });

  it('loads a stack manifest', async () => {
    const stack = await loadStack(STACKS, 'ts-node-npm');
    assert.equal(stack.name, 'ts-node-npm');
    assert.equal(stack.manifest.kind, 'base');
    assert.ok(stack.manifest.commands.dev);
  });

  it('throws for nonexistent stack', async () => {
    await assert.rejects(() => loadStack(STACKS, 'nonexistent'), /not found/);
  });
});

// ─── Merge manifests ──────────────────────────────────────────────────────────

describe('mergeManifests', () => {
  it('merges base + overlay commands (overlay wins)', async () => {
    const base = await loadStack(STACKS, 'ts-node-npm');
    const overlay = await loadStack(STACKS, 'react-mantine');
    const merged = mergeManifests([base, overlay]);

    // Overlay overrides test:unit
    assert.equal(merged.commands['test:unit'], 'npx vitest run');
    // Overlay adds storybook
    assert.equal(merged.commands['storybook'], 'npm run storybook');
    // Base-only commands survive
    assert.equal(merged.commands['deps:install'], 'npm install');
  });

  it('overlay overrides layout and testFramework', async () => {
    const base = await loadStack(STACKS, 'ts-node-npm');
    const overlay = await loadStack(STACKS, 'react-mantine');
    const merged = mergeManifests([base, overlay]);

    assert.equal(merged.layout, 'src/features/{module}/{api,model,hooks,pages,components}');
    assert.equal(merged.testFramework, 'vitest');
  });
});

// ─── Full scaffold tests per stack ────────────────────────────────────────────

const BASE_STACKS = ['ts-node-npm', 'js-node-npm', 'java-gradle', 'java-spring-gradle', 'python-uv', 'go'];
const cleanupDirs = [];

after(async () => {
  for (const d of cleanupDirs) {
    await rm(d, { recursive: true, force: true }).catch(() => {});
  }
});

for (const stackName of BASE_STACKS) {
  describe(`scaffold: ${stackName}`, () => {
    let dir, merged, context;

    before(async () => {
      ({ dir, merged, context } = await scaffoldProject(stackName));
      cleanupDirs.push(dir);
    });

    it('generates CLAUDE.md with correct commands', async () => {
      const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
      for (const [key, value] of Object.entries(merged.commands)) {
        assert.ok(
          claudeMd.includes(value),
          `CLAUDE.md should contain command "${value}" for key "${key}"`,
        );
      }
    });

    it('generates CLAUDE.md with project name', async () => {
      const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
      assert.ok(claudeMd.startsWith('# test-project'), 'CLAUDE.md should start with project name');
    });

    it('generates CLAUDE.md with layout', async () => {
      const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
      assert.ok(
        claudeMd.includes(merged.layout),
        `CLAUDE.md should contain layout "${merged.layout}"`,
      );
    });

    it('generates .gitignore with core entries', async () => {
      const gitignore = await fileContent(join(dir, '.gitignore'));
      assert.ok(gitignore.includes('.DS_Store'), '.gitignore should have core entries');
      assert.ok(gitignore.includes('.idea/'), '.gitignore should have IDE entries');
    });

    it('generates .gitignore with stack-specific entries', async () => {
      const gitignore = await fileContent(join(dir, '.gitignore'));
      const stackAppend = join(STACKS, stackName, 'gitignore.append');
      if (existsSync(stackAppend)) {
        const append = await fileContent(stackAppend);
        // Check that non-comment, non-empty lines are present
        const lines = append.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
        for (const line of lines) {
          assert.ok(
            gitignore.includes(line.trim()),
            `.gitignore should contain stack entry "${line.trim()}"`,
          );
        }
      }
    });

    it('generates core skills', async () => {
      const coreSkills = join(dir, '.claude', 'skills', '_core');
      assert.ok(await dirExists(coreSkills), 'Core skills directory should exist');
      const files = await readdir(coreSkills);
      assert.ok(files.includes('write-adr.md'), 'Should have write-adr skill');
      assert.ok(files.includes('write-spec.md'), 'Should have write-spec skill');
      assert.ok(files.includes('enforce-boundary.md'), 'Should have enforce-boundary skill');
    });

    it('copies stack-specific skills if they exist', async () => {
      const stackSkillsSrc = join(STACKS, stackName, 'skills');
      if (existsSync(stackSkillsSrc)) {
        const srcFiles = await readdir(stackSkillsSrc);
        if (srcFiles.length > 0) {
          const dstDir = join(dir, '.claude', 'skills', stackName);
          assert.ok(await dirExists(dstDir), `Stack skills dir should exist for ${stackName}`);
          const dstFiles = await readdir(dstDir);
          for (const f of srcFiles) {
            assert.ok(dstFiles.includes(f), `Stack skill "${f}" should be copied`);
          }
        }
      }
    });

    it('generates AGENTS.md', async () => {
      assert.ok(existsSync(join(dir, 'AGENTS.md')), 'AGENTS.md should exist');
    });

    it('generates workflow docs', async () => {
      assert.ok(existsSync(join(dir, 'docs', 'specs', 'WORKFLOW.md')), 'WORKFLOW.md should exist');
    });

    it('generates memory scaffold', async () => {
      assert.ok(existsSync(join(dir, 'memory', 'MEMORY.md')), 'memory/MEMORY.md should exist');
    });
  });
}

// ─── Overlay scaffold tests ───────────────────────────────────────────────────

describe('scaffold: ts-node-npm + react-mantine (overlay)', () => {
  let dir, merged;

  before(async () => {
    ({ dir, merged } = await scaffoldProject('ts-node-npm', 'react-mantine'));
    cleanupDirs.push(dir);
  });

  it('CLAUDE.md contains overlay commands', async () => {
    const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
    assert.ok(claudeMd.includes('npm run storybook'), 'Should contain storybook command');
    assert.ok(claudeMd.includes('npx vitest run'), 'Should contain overridden test:unit');
  });

  it('CLAUDE.md contains overlay layout', async () => {
    const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
    assert.ok(
      claudeMd.includes('src/features/{module}/{api,model,hooks,pages,components}'),
      'Should contain overlay layout',
    );
  });

  it('.gitignore has base stack entries', async () => {
    const gitignore = await fileContent(join(dir, '.gitignore'));
    assert.ok(gitignore.includes('node_modules/'), 'Should have node_modules from base');
  });

  it('base stack commands that overlay does not override are preserved', async () => {
    const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
    // deps:add is only in ts-node-npm base, not in react-mantine overlay
    assert.ok(claudeMd.includes('npm install'), 'Should preserve base-only commands');
  });

  it('copies overlay skills alongside base skills', async () => {
    const overlaySkillsDir = join(dir, '.claude', 'skills', 'react-mantine');
    assert.ok(await dirExists(overlaySkillsDir), 'Overlay skills dir should exist');
    const files = await readdir(overlaySkillsDir);
    assert.ok(files.includes('create-component-mantine.md'));
    assert.ok(files.includes('create-page-mantine.md'));
    assert.ok(files.includes('frontend-hooks-react-query.md'));

    // Base skills also present (not overwritten by overlay)
    const baseSkillsDir = join(dir, '.claude', 'skills', 'ts-node-npm');
    assert.ok(await dirExists(baseSkillsDir), 'Base skills dir should coexist');
  });
});

describe('scaffold: ts-node-npm + react-mui (overlay)', () => {
  let dir, merged;

  before(async () => {
    ({ dir, merged } = await scaffoldProject('ts-node-npm', 'react-mui'));
    cleanupDirs.push(dir);
  });

  it('CLAUDE.md contains mui overlay commands', async () => {
    const claudeMd = await fileContent(join(dir, 'CLAUDE.md'));
    assert.ok(claudeMd.includes('npm run storybook'), 'Should contain storybook command');
  });

  it('uses vitest from overlay', () => {
    assert.equal(merged.testFramework, 'vitest');
  });

  it('copies overlay skills', async () => {
    const overlaySkillsDir = join(dir, '.claude', 'skills', 'react-mui');
    assert.ok(await dirExists(overlaySkillsDir), 'Overlay skills dir should exist');
    const files = await readdir(overlaySkillsDir);
    assert.ok(files.includes('create-component-mui.md'));
    assert.ok(files.includes('create-page-mui.md'));
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, rm, readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyTree, appendFile, createSymlinks } from '../lib/copy.js';
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

const AGENT_LAYER2_FILES = {
  claude: 'CLAUDE.md.tmpl',
  gemini: 'GEMINI.md.tmpl',
  copilot: '.github/copilot-instructions.md.tmpl',
  cursor: '.cursorrules.tmpl',
};

async function scaffoldProject(baseName, overlayName = null, agents = ['claude', 'codex', 'gemini', 'copilot', 'cursor']) {
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

  // Copy core (filtering Layer 2 files by agents)
  const enabledLayer2 = new Set();
  for (const a of agents) if (AGENT_LAYER2_FILES[a]) enabledLayer2.add(AGENT_LAYER2_FILES[a]);
  const allLayer2 = new Set(Object.values(AGENT_LAYER2_FILES));
  const skipRel = [...allLayer2].filter((p) => !enabledLayer2.has(p));
  await copyTree(CORE, dir, context, { skipRelative: skipRel });

  // Apply stacks
  for (const stack of selectedStacks) {
    const templatesDir = join(stack.dir, 'templates');
    if (existsSync(templatesDir)) {
      await copyTree(templatesDir, dir, context);
    }
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(dir, '.agents', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }
    const gitignore = join(stack.dir, 'gitignore.append');
    if (existsSync(gitignore)) {
      await appendFile(gitignore, join(dir, '.gitignore'));
    }
  }

  await createSymlinks(dir, agents);

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
    await rm(d, { recursive: true, force: true }).catch(() => { });
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

    it('generates AGENTS.md with layout', async () => {
      const agentsMd = await fileContent(join(dir, 'AGENTS.md'));
      assert.ok(
        agentsMd.includes(merged.layout),
        `AGENTS.md should contain layout "${merged.layout}"`,
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

    it('generates core skills as folders with SKILL.md', async () => {
      const coreSkills = join(dir, '.agents', 'skills', '_core');
      assert.ok(await dirExists(coreSkills), 'Core skills directory should exist');
      for (const name of ['write-adr', 'write-spec', 'write-readme', 'enforce-boundary']) {
        assert.ok(await dirExists(join(coreSkills, name)), `${name} directory should exist`);
        assert.ok(existsSync(join(coreSkills, name, 'SKILL.md')), `${name}/SKILL.md should exist`);
      }
    });

    it('copies stack-specific skills as folders with SKILL.md', async () => {
      const stackSkillsSrc = join(STACKS, stackName, 'skills');
      if (existsSync(stackSkillsSrc)) {
        const srcEntries = await readdir(stackSkillsSrc, { withFileTypes: true });
        const skillDirs = srcEntries.filter((e) => e.isDirectory()).map((e) => e.name);
        if (skillDirs.length > 0) {
          const dstDir = join(dir, '.agents', 'skills', stackName);
          assert.ok(await dirExists(dstDir), `Stack skills dir should exist for ${stackName}`);
          for (const skill of skillDirs) {
            assert.ok(
              existsSync(join(dstDir, skill, 'SKILL.md')),
              `${stackName}/${skill}/SKILL.md should exist`,
            );
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

  it('AGENTS.md contains overlay layout', async () => {
    const agentsMd = await fileContent(join(dir, 'AGENTS.md'));
    assert.ok(
      agentsMd.includes('src/features/{module}/{api,model,hooks,pages,components}'),
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
    const overlaySkillsDir = join(dir, '.agents', 'skills', 'react-mantine');
    assert.ok(await dirExists(overlaySkillsDir), 'Overlay skills dir should exist');
    for (const skill of ['create-component-mantine', 'create-page-mantine', 'frontend-hooks-react-query']) {
      assert.ok(existsSync(join(overlaySkillsDir, skill, 'SKILL.md')), `${skill}/SKILL.md should exist`);
    }

    // Base skills also present (not overwritten by overlay)
    const baseSkillsDir = join(dir, '.agents', 'skills', 'ts-node-npm');
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
    const overlaySkillsDir = join(dir, '.agents', 'skills', 'react-mui');
    assert.ok(await dirExists(overlaySkillsDir), 'Overlay skills dir should exist');
    for (const skill of ['create-component-mui', 'create-page-mui']) {
      assert.ok(existsSync(join(overlaySkillsDir, skill, 'SKILL.md')), `${skill}/SKILL.md should exist`);
    }
  });
});

// ─── Multi-agent Layer 2 tests ────────────────────────────────────────────────

describe('multi-agent: default generates all Layer 2 files', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('generates AGENTS.md at project root', () => {
    assert.ok(existsSync(join(dir, 'AGENTS.md')), 'AGENTS.md must exist');
  });

  it('generates CLAUDE.md at project root', () => {
    assert.ok(existsSync(join(dir, 'CLAUDE.md')), 'CLAUDE.md must exist');
  });

  it('generates GEMINI.md at project root', () => {
    assert.ok(existsSync(join(dir, 'GEMINI.md')), 'GEMINI.md must exist');
  });

  it('generates .github/copilot-instructions.md', () => {
    assert.ok(existsSync(join(dir, '.github', 'copilot-instructions.md')), 'copilot-instructions.md must exist');
  });

  it('generates .cursorrules', () => {
    assert.ok(existsSync(join(dir, '.cursorrules')), '.cursorrules must exist');
  });

  it('generates README.md', () => {
    assert.ok(existsSync(join(dir, 'README.md')), 'README.md must exist');
  });

  it('CLAUDE.md references AGENTS.md and does not duplicate rules', async () => {
    const content = await fileContent(join(dir, 'CLAUDE.md'));
    assert.match(content, /See .?AGENTS\.md/i, 'must reference AGENTS.md');
    assert.doesNotMatch(content, /NEVER import infrastructure/i, 'must not duplicate critical rules');
  });

  it('AGENTS.md contains the critical rule catalog', async () => {
    const content = await fileContent(join(dir, 'AGENTS.md'));
    assert.match(content, /## Critical Rules/);
    assert.match(content, /NEVER import infrastructure/);
  });
});

// ─── --agents filter tests ────────────────────────────────────────────────────

describe('multi-agent: --agents claude,codex limits Layer 2 output', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm', null, ['claude', 'codex']));
    cleanupDirs.push(dir);
  });

  it('generates AGENTS.md (always, universal)', () => {
    assert.ok(existsSync(join(dir, 'AGENTS.md')));
  });

  it('generates CLAUDE.md (requested)', () => {
    assert.ok(existsSync(join(dir, 'CLAUDE.md')));
  });

  it('skips GEMINI.md (not requested)', () => {
    assert.ok(!existsSync(join(dir, 'GEMINI.md')), 'GEMINI.md must NOT exist');
  });

  it('skips .github/copilot-instructions.md (not requested)', () => {
    assert.ok(!existsSync(join(dir, '.github', 'copilot-instructions.md')));
  });

  it('skips .cursorrules (not requested)', () => {
    assert.ok(!existsSync(join(dir, '.cursorrules')));
  });
});

// ─── Symlink tests ────────────────────────────────────────────────────────────

describe('multi-agent: symlinks point to .agents/skills (Unix)', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('.claude/skills is a symlink to ../.agents/skills', async () => {
    if (process.platform === 'win32') return;
    const { lstat, readlink } = await import('node:fs/promises');
    const linkPath = join(dir, '.claude', 'skills');
    const s = await lstat(linkPath);
    assert.ok(s.isSymbolicLink(), '.claude/skills must be a symlink');
    const target = await readlink(linkPath);
    assert.equal(target, '../.agents/skills');
  });

  it('.github/skills is a symlink to ../.agents/skills', async () => {
    if (process.platform === 'win32') return;
    const { lstat, readlink } = await import('node:fs/promises');
    const linkPath = join(dir, '.github', 'skills');
    const s = await lstat(linkPath);
    assert.ok(s.isSymbolicLink());
    const target = await readlink(linkPath);
    assert.equal(target, '../.agents/skills');
  });

  it('resolved symlink path contains SKILL.md files', async () => {
    if (process.platform === 'win32') return;
    const resolved = join(dir, '.claude', 'skills', '_core');
    const entries = await readdir(resolved, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    assert.ok(dirs.includes('write-adr'));
    assert.ok(dirs.includes('enforce-boundary'));
  });
});

// ─── Frontmatter validation tests ─────────────────────────────────────────────

async function parseFrontmatter(path) {
  const content = await readFile(path, 'utf8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const result = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (m) {
      currentKey = m[1];
      result[currentKey] = m[2].trim();
    } else if (line.match(/^\s+([a-zA-Z_-]+):\s*(.*)$/)) {
      const nm = line.match(/^\s+([a-zA-Z_-]+):\s*(.*)$/);
      if (currentKey === 'metadata') {
        result.metadata = result.metadata || {};
        result.metadata[nm[1]] = nm[2].trim();
      }
    }
  }
  return result;
}

describe('skill frontmatter: required fields present in every SKILL.md', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('every SKILL.md has name, description, and metadata.skill_type', async () => {
    async function walk(d) {
      const entries = await readdir(d, { withFileTypes: true });
      const files = [];
      for (const e of entries) {
        const p = join(d, e.name);
        if (e.isDirectory()) files.push(...(await walk(p)));
        else if (e.name === 'SKILL.md') files.push(p);
      }
      return files;
    }

    const root = join(dir, '.agents', 'skills');
    const skillFiles = await walk(root);
    assert.ok(skillFiles.length > 0, 'must find at least one SKILL.md');

    for (const file of skillFiles) {
      const fm = await parseFrontmatter(file);
      assert.ok(fm, `${file}: frontmatter must be present`);
      assert.ok(fm.name, `${file}: frontmatter.name required`);
      assert.ok(fm.description, `${file}: frontmatter.description required`);
      assert.ok(fm.metadata && fm.metadata.skill_type, `${file}: metadata.skill_type required`);
      assert.ok(
        ['micro', 'meta', 'constraint'].includes(fm.metadata.skill_type),
        `${file}: skill_type must be micro | meta | constraint`,
      );
    }
  });
});

// ─── Size budget tests ────────────────────────────────────────────────────────

describe('size budgets: AGENTS.md and CLAUDE.md stay lean', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('AGENTS.md is <= 80 lines', async () => {
    const content = await fileContent(join(dir, 'AGENTS.md'));
    const lines = content.split('\n').length;
    assert.ok(lines <= 80, `AGENTS.md has ${lines} lines (limit 80)`);
  });

  it('CLAUDE.md is <= 100 lines', async () => {
    const content = await fileContent(join(dir, 'CLAUDE.md'));
    const lines = content.split('\n').length;
    assert.ok(lines <= 100, `CLAUDE.md has ${lines} lines (limit 100)`);
  });
});

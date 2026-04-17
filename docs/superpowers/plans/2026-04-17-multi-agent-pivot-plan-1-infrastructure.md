# Multi-Agent Pivot — Plan 1: Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [2026-04-17-multi-agent-pivot-design.md](../specs/2026-04-17-multi-agent-pivot-design.md)

**Goal:** Pivot the package from Claude-only to multi-agent (Claude, Codex, Gemini, Copilot, Cursor) at the infrastructure level — file layout, renderer, CLI, templates, and tests. Skill content is preserved verbatim; only frontmatter is updated and files are moved into folder format.

**Architecture:** Source of truth is `.agents/skills/{name}/SKILL.md`. Per-agent files (`CLAUDE.md`, `GEMINI.md`, etc.) are thin references to `AGENTS.md` (universal). Symlinks from `.claude/skills/` and `.github/skills/` point at the canonical directory. The CLI gains `--agents <list>` to filter which per-agent stubs get generated.

**Tech Stack:** Node.js ≥ 18 (fs/promises, node:util parseArgs, fs.symlink), `@clack/prompts`, `node:test`.

**Out of scope (Plan 2):** Rewriting the 21 skills into the full English body format (Instructions / Critical / Examples / Troubleshooting / Performance Notes / See also); publishing v1.0.0; deprecating old package; renaming repo.

---

## File Structure

**New files:**
- `core/AGENTS.md.tmpl` — universal source of truth (rewritten; formerly a partial AGENTS.md.tmpl existed but is fully replaced)
- `core/GEMINI.md.tmpl` — stub referencing AGENTS.md
- `core/.github/copilot-instructions.md.tmpl` — stub
- `core/.cursorrules.tmpl` — stub
- `core/README.md.tmpl` — one-screen human guide to Layer 1/2/3
- `core/.agents/skills/_core/write-adr/SKILL.md` — moved from `core/.claude/skills/_core/write-adr.md`
- `core/.agents/skills/_core/write-spec/SKILL.md` — moved
- `core/.agents/skills/_core/write-readme/SKILL.md` — moved
- `core/.agents/skills/_core/enforce-boundary/SKILL.md` — moved
- `stacks/{stack}/skills/{skill-name}/SKILL.md` — 17 skill files migrated to folder format

**Modified files:**
- `package.json` — name, version (1.0.0-0), repository, homepage, bugs, description
- `bin/create.js` — help text, `--agents` flag, per-agent filtering, symlink invocation
- `lib/copy.js` — add `createSymlinks(targetDir, agents)` function
- `core/CLAUDE.md.tmpl` — rewritten as thin reference to AGENTS.md
- `test/scaffold.test.js` — path updates + new test suites

**Removed files:**
- `core/.claude/skills/_core/*.md` — replaced by folder structure in `core/.agents/skills/_core/`
- `stacks/{stack}/skills/*.md` — replaced by folder structure

---

## Task 1: Verify prerequisites and baseline

**Files:** none (checks only)

- [ ] **Step 1: Verify npm package name availability**

Run: `npm view @josenaldo/create-agents-workflow 2>&1 | head -5`

Expected: `npm error code E404` (package does not exist; name is available).

If the package already exists under a different owner, stop and pick an alternate name per the spec's Risk section.

- [ ] **Step 2: Verify current test suite is green**

Run: `cd /home/josenaldo/repos/personal/claude-workflow-template && node --test 'test/**/*.test.js' 2>&1 | tail -12`

Expected: `# pass 76` and `# fail 0`.

- [ ] **Step 3: Create a feature branch**

Run: `git checkout -b feature/multi-agent-pivot-infrastructure`

Expected: `Switched to a new branch 'feature/multi-agent-pivot-infrastructure'`.

No commit for this task.

---

## Task 2: Update package.json for the new package identity

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read current package.json**

Run: `cat package.json`

- [ ] **Step 2: Replace package.json with the new identity**

Write file `package.json` with content:

```json
{
  "name": "@josenaldo/create-agents-workflow",
  "version": "1.0.0-0",
  "description": "Scaffolding CLI to bootstrap a multi-agent Claude Code / Codex / Gemini / Copilot / Cursor workflow (AGENTS.md + skills + memory + command mapping) tailored to a chosen stack",
  "type": "module",
  "bin": {
    "create-agents-workflow": "bin/create.js"
  },
  "files": [
    "bin",
    "lib",
    "core",
    "stacks",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "test": "node --test test/**/*.test.js"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/josenaldo/agents-workflow-template.git"
  },
  "homepage": "https://github.com/josenaldo/agents-workflow-template#readme",
  "bugs": {
    "url": "https://github.com/josenaldo/agents-workflow-template/issues"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@clack/prompts": "^0.7.0",
    "picocolors": "^1.0.0"
  },
  "keywords": [
    "claude",
    "claude-code",
    "codex",
    "gemini",
    "copilot",
    "cursor",
    "agents-md",
    "scaffolding",
    "template",
    "clean-architecture",
    "context-engineering"
  ],
  "license": "MIT"
}
```

Note: `repository.url` references `agents-workflow-template` which does not yet exist on GitHub; that rename happens in Plan 2. Using the new URL here is intentional so that the published package points to the final location.

- [ ] **Step 3: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('OK')"`

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: rename package to @josenaldo/create-agents-workflow 1.0.0-0"
```

---

## Task 3: Update bin/create.js help text and banner

**Files:**
- Modify: `bin/create.js`

- [ ] **Step 1: Update the help text**

In `bin/create.js`, replace the existing `flags.help` block (lines ~31-49) with:

```js
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
```

- [ ] **Step 2: Update the intro banner**

Replace `intro(pc.bgMagenta(pc.black(' create-claude-workflow ')));` with:

```js
intro(pc.bgMagenta(pc.black(' create-agents-workflow ')));
```

- [ ] **Step 3: Verify CLI still runs**

Run: `node bin/create.js --help`

Expected: help text prints with the new banner and includes `--agents` option.

- [ ] **Step 4: Commit**

```bash
git add bin/create.js
git commit -m "feat(cli): update banner and help for multi-agent pivot"
```

---

## Task 4: Define the canonical agent list constant

**Files:**
- Modify: `bin/create.js`

- [ ] **Step 1: Add agent constant near the top of the file**

In `bin/create.js`, after the import block and before `parseArgs`, add:

```js
// All agents supported by the multi-agent pivot. Each agent corresponds to a Layer 2 file (stub).
// Symlink logic for agents that use a native skills directory lives in lib/copy.js.
const ALL_AGENTS = ['claude', 'codex', 'gemini', 'copilot', 'cursor'];
```

- [ ] **Step 2: Verify no syntax error**

Run: `node --check bin/create.js`

Expected: (no output = success).

- [ ] **Step 3: Commit**

```bash
git add bin/create.js
git commit -m "feat(cli): declare ALL_AGENTS and AGENTS_WITH_SYMLINK constants"
```

---

## Task 5: Parse and validate the --agents CLI flag

**Files:**
- Modify: `bin/create.js`

- [ ] **Step 1: Add `agents` to the parseArgs options block**

In `bin/create.js`, the existing `parseArgs` call has an `options` object. Add this entry:

```js
    agents: { type: 'string', default: '' },
```

After the change, the options object should include: `yes`, `stack`, `overlay`, `agents`, `dry-run`, `help`.

- [ ] **Step 2: Derive the resolved agent list after parseArgs**

Right after the existing lines `const autoYes = flags.yes;` and `const dryRun = flags['dry-run'];`, add:

```js
const requestedAgents = flags.agents
  ? flags.agents.split(',').map((s) => s.trim()).filter(Boolean)
  : ALL_AGENTS;

// Validate
for (const a of requestedAgents) {
  if (!ALL_AGENTS.includes(a)) {
    console.error(pc.red('Error:'), `Unknown agent "${a}". Valid: ${ALL_AGENTS.join(', ')}`);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Test invalid agent is rejected**

Run: `node bin/create.js foo --stack ts-node-npm --yes --agents bogus 2>&1 | head -2`

Expected: `Error: Unknown agent "bogus". Valid: claude, codex, gemini, copilot, cursor`.

- [ ] **Step 4: Test valid agent list parses**

Run: `node bin/create.js foo --stack ts-node-npm --dry-run --agents claude,codex 2>&1 | grep -i stack`

Expected: output lists the stack without any error.

- [ ] **Step 5: Commit**

```bash
git add bin/create.js
git commit -m "feat(cli): parse and validate --agents flag"
```

---

## Task 6: Add `createSymlinks` function to lib/copy.js

**Files:**
- Modify: `lib/copy.js`
- Test: `test/copy.test.js` (new file)

- [ ] **Step 1: Write the failing test**

Create `test/copy.test.js`:

```js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, lstat, readlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createSymlinks } from '../lib/copy.js';

const TMP = '/tmp/ccw-symlink-test';

describe('createSymlinks', () => {
  before(async () => {
    await rm(TMP, { recursive: true, force: true });
    await mkdir(join(TMP, '.agents/skills/foo'), { recursive: true });
    await writeFile(join(TMP, '.agents/skills/foo/SKILL.md'), '# foo');
  });

  after(async () => {
    await rm(TMP, { recursive: true, force: true });
  });

  it('creates .claude/skills symlink to ../.agents/skills on Unix', async () => {
    if (process.platform === 'win32') return; // skipped on Windows
    await createSymlinks(TMP, ['claude']);
    const link = join(TMP, '.claude/skills');
    assert.ok(existsSync(link), '.claude/skills should exist');
    const stat = await lstat(link);
    assert.ok(stat.isSymbolicLink(), 'should be a symlink');
    const target = await readlink(link);
    assert.equal(target, '../.agents/skills');
  });

  it('creates .github/skills symlink for copilot agent', async () => {
    if (process.platform === 'win32') return;
    await createSymlinks(TMP, ['copilot']);
    const link = join(TMP, '.github/skills');
    assert.ok(existsSync(link), '.github/skills should exist');
  });

  it('skips agents not in AGENTS_WITH_SYMLINK (e.g., gemini)', async () => {
    await createSymlinks(TMP, ['gemini']);
    assert.ok(!existsSync(join(TMP, '.gemini/skills')), 'no symlink expected for gemini');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test test/copy.test.js 2>&1 | tail -5`

Expected: FAIL with `SyntaxError: ... 'createSymlinks' is not exported` or similar.

- [ ] **Step 3: Implement createSymlinks in lib/copy.js**

Append to `lib/copy.js`:

```js
import { symlink } from 'node:fs/promises';

const AGENTS_WITH_SYMLINK_PATHS = {
  claude: '.claude/skills',
  copilot: '.github/skills',
};

// Creates relative directory symlinks from each agent's native skills directory
// to the canonical .agents/skills/ source of truth.
// On Windows or when symlink fails, falls back to a recursive copy and emits a warning.
export async function createSymlinks(targetDir, agents) {
  for (const agent of agents) {
    const relPath = AGENTS_WITH_SYMLINK_PATHS[agent];
    if (!relPath) continue; // agent does not need a symlink

    const linkPath = join(targetDir, relPath);
    await mkdir(dirname(linkPath), { recursive: true });

    // Remove any pre-existing file/dir/link at the target path
    try {
      await rm(linkPath, { recursive: true, force: true });
    } catch {}

    // Compute relative target: ../../.agents/skills or similar
    // Since linkPath is {targetDir}/{relPath} and canonical is {targetDir}/.agents/skills,
    // the relative link target is computed per path segment depth.
    const depth = relPath.split('/').length;
    const relTarget = '../'.repeat(depth - 1) + '.agents/skills';

    try {
      await symlink(relTarget, linkPath, 'dir');
    } catch (err) {
      if (err.code === 'EPERM' || err.code === 'ENOSYS') {
        // Windows or restricted environment — fall back to copy
        const source = join(targetDir, '.agents/skills');
        await cp(source, linkPath, { recursive: true });
        console.warn(
          pc.yellow(`⚠ Symlink unavailable at ${relPath}. Skills duplicated instead. Edit only .agents/skills/ and re-run to sync.`)
        );
      } else {
        throw err;
      }
    }
  }
}
```

You will also need to add these imports at the top of `lib/copy.js`:

```js
import { mkdir, cp, rm, readFile, readdir, stat, writeFile, symlink } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import pc from 'picocolors';
```

Replace the existing import line (currently: `import { cp, readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';`) and the `import { join, relative, dirname } from 'node:path';` line with the consolidated version above. Add `import pc from 'picocolors';` (new dependency use in this file).

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test test/copy.test.js 2>&1 | tail -5`

Expected: `# pass 3` and `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add lib/copy.js test/copy.test.js
git commit -m "feat(lib): add createSymlinks with Windows copy fallback"
```

---

## Task 7: Migrate core skills from flat .md to folder format

**Files:**
- Move: `core/.claude/skills/_core/write-adr.md` → `core/.agents/skills/_core/write-adr/SKILL.md`
- Move: `core/.claude/skills/_core/write-spec.md` → `core/.agents/skills/_core/write-spec/SKILL.md`
- Move: `core/.claude/skills/_core/write-readme.md` → `core/.agents/skills/_core/write-readme/SKILL.md`
- Move: `core/.claude/skills/_core/enforce-boundary.md` → `core/.agents/skills/_core/enforce-boundary/SKILL.md`

- [ ] **Step 1: Create the new directory structure**

```bash
mkdir -p core/.agents/skills/_core/{write-adr,write-spec,write-readme,enforce-boundary}
```

- [ ] **Step 2: Move each core skill file and add metadata.skill_type**

For **write-adr**:

```bash
git mv core/.claude/skills/_core/write-adr.md core/.agents/skills/_core/write-adr/SKILL.md
```

Then edit `core/.agents/skills/_core/write-adr/SKILL.md` — replace the existing frontmatter (the `---` block) with:

```yaml
---
name: write-adr
description: Write an Architecture Decision Record capturing a significant technical decision, trade-off, or risk.
metadata:
  skill_type: micro
---
```

For **write-spec**:

```bash
git mv core/.claude/skills/_core/write-spec.md core/.agents/skills/_core/write-spec/SKILL.md
```

Replace frontmatter with:

```yaml
---
name: write-spec
description: Create or update a user story with acceptance criteria in docs/specs/{module}/user-stories/.
metadata:
  skill_type: micro
---
```

For **write-readme**:

```bash
git mv core/.claude/skills/_core/write-readme.md core/.agents/skills/_core/write-readme/SKILL.md
```

Replace frontmatter with:

```yaml
---
name: write-readme
description: Create or update a README.md for a module, feature, or the project root.
metadata:
  skill_type: micro
---
```

For **enforce-boundary**:

```bash
git mv core/.claude/skills/_core/enforce-boundary.md core/.agents/skills/_core/enforce-boundary/SKILL.md
```

Replace frontmatter with:

```yaml
---
name: enforce-boundary
description: Verify Clean Architecture layer boundaries — domain and application must not import infrastructure.
metadata:
  skill_type: constraint
---
```

- [ ] **Step 3: Remove the empty old directory**

```bash
rmdir core/.claude/skills/_core core/.claude/skills core/.claude 2>/dev/null || true
```

Verify: `ls core/.claude 2>&1` should return `No such file or directory`.

- [ ] **Step 4: Verify new structure**

```bash
find core/.agents/skills/_core -type f | sort
```

Expected output (exactly):

```text
core/.agents/skills/_core/enforce-boundary/SKILL.md
core/.agents/skills/_core/write-adr/SKILL.md
core/.agents/skills/_core/write-readme/SKILL.md
core/.agents/skills/_core/write-spec/SKILL.md
```

- [ ] **Step 5: Commit**

```bash
git add core/.agents core/.claude
git commit -m "refactor(core): migrate core skills to .agents/skills/{name}/SKILL.md format"
```

---

## Task 8: Migrate ts-node-npm stack skills to folder format

**Files:**
- Move: `stacks/ts-node-npm/skills/create-usecase.md` → `stacks/ts-node-npm/skills/create-usecase/SKILL.md`
- Move: `stacks/ts-node-npm/skills/add-endpoint-express.md` → `stacks/ts-node-npm/skills/add-endpoint-express/SKILL.md`
- Move: `stacks/ts-node-npm/skills/write-unit-test-jest.md` → `stacks/ts-node-npm/skills/write-unit-test-jest/SKILL.md`

- [ ] **Step 1: Create directories and move files**

```bash
cd stacks/ts-node-npm/skills
for name in create-usecase add-endpoint-express write-unit-test-jest; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter on each SKILL.md to add `metadata.skill_type` and `metadata.stack`**

For `stacks/ts-node-npm/skills/create-usecase/SKILL.md`, replace the top frontmatter with:

```yaml
---
name: create-usecase
description: Scaffold a new Use Case class following Clean Architecture in a TypeScript + Node project.
metadata:
  skill_type: micro
  stack: ts-node-npm
---
```

For `stacks/ts-node-npm/skills/add-endpoint-express/SKILL.md`:

```yaml
---
name: add-endpoint-express
description: Add a new Express HTTP endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: ts-node-npm
---
```

For `stacks/ts-node-npm/skills/write-unit-test-jest/SKILL.md`:

```yaml
---
name: write-unit-test-jest
description: Write a unit test for a Use Case or domain entity using Jest in a TypeScript + Node project.
metadata:
  skill_type: micro
  stack: ts-node-npm
---
```

- [ ] **Step 3: Verify structure**

```bash
find stacks/ts-node-npm/skills -type f | sort
```

Expected:

```text
stacks/ts-node-npm/skills/add-endpoint-express/SKILL.md
stacks/ts-node-npm/skills/create-usecase/SKILL.md
stacks/ts-node-npm/skills/write-unit-test-jest/SKILL.md
```

- [ ] **Step 4: Commit**

```bash
git add stacks/ts-node-npm/skills
git commit -m "refactor(ts-node-npm): migrate skills to folder format with SKILL.md"
```

---

## Task 9: Migrate java-spring-gradle stack skills to folder format

**Files:**
- Move: `stacks/java-spring-gradle/skills/create-usecase-spring.md` → `.../create-usecase-spring/SKILL.md`
- Move: `stacks/java-spring-gradle/skills/add-endpoint-spring.md` → `.../add-endpoint-spring/SKILL.md`
- Move: `stacks/java-spring-gradle/skills/write-unit-test-junit.md` → `.../write-unit-test-junit/SKILL.md`

- [ ] **Step 1: Move files**

```bash
cd stacks/java-spring-gradle/skills
for name in create-usecase-spring add-endpoint-spring write-unit-test-junit; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter for each**

For `stacks/java-spring-gradle/skills/create-usecase-spring/SKILL.md`:

```yaml
---
name: create-usecase-spring
description: Scaffold a new Use Case class following Clean Architecture in a Java + Spring Boot project.
metadata:
  skill_type: micro
  stack: java-spring-gradle
---
```

For `stacks/java-spring-gradle/skills/add-endpoint-spring/SKILL.md`:

```yaml
---
name: add-endpoint-spring
description: Add a new Spring Boot REST endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: java-spring-gradle
---
```

For `stacks/java-spring-gradle/skills/write-unit-test-junit/SKILL.md`:

```yaml
---
name: write-unit-test-junit
description: Write a unit test for a Use Case or domain entity using JUnit 5 in a Java + Spring Boot project.
metadata:
  skill_type: micro
  stack: java-spring-gradle
---
```

- [ ] **Step 3: Verify and commit**

```bash
find stacks/java-spring-gradle/skills -type f | sort
git add stacks/java-spring-gradle/skills
git commit -m "refactor(java-spring-gradle): migrate skills to folder format"
```

---

## Task 10: Migrate python-uv stack skills to folder format

**Files:**
- Move: `stacks/python-uv/skills/create-usecase-fastapi.md` → `.../create-usecase-fastapi/SKILL.md`
- Move: `stacks/python-uv/skills/add-endpoint-fastapi.md` → `.../add-endpoint-fastapi/SKILL.md`
- Move: `stacks/python-uv/skills/write-unit-test-pytest.md` → `.../write-unit-test-pytest/SKILL.md`

- [ ] **Step 1: Move files**

```bash
cd stacks/python-uv/skills
for name in create-usecase-fastapi add-endpoint-fastapi write-unit-test-pytest; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter for each**

For `stacks/python-uv/skills/create-usecase-fastapi/SKILL.md`:

```yaml
---
name: create-usecase-fastapi
description: Scaffold a new Use Case class following Clean Architecture in a Python + FastAPI project.
metadata:
  skill_type: micro
  stack: python-uv
---
```

For `stacks/python-uv/skills/add-endpoint-fastapi/SKILL.md`:

```yaml
---
name: add-endpoint-fastapi
description: Add a new FastAPI HTTP endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: python-uv
---
```

For `stacks/python-uv/skills/write-unit-test-pytest/SKILL.md`:

```yaml
---
name: write-unit-test-pytest
description: Write a unit test for a Use Case or domain entity using pytest in a Python project.
metadata:
  skill_type: micro
  stack: python-uv
---
```

- [ ] **Step 3: Verify and commit**

```bash
find stacks/python-uv/skills -type f | sort
git add stacks/python-uv/skills
git commit -m "refactor(python-uv): migrate skills to folder format"
```

---

## Task 11: Migrate go stack skills to folder format

**Files:**
- Move: `stacks/go/skills/create-usecase-go.md` → `.../create-usecase-go/SKILL.md`
- Move: `stacks/go/skills/add-endpoint-gin.md` → `.../add-endpoint-gin/SKILL.md`
- Move: `stacks/go/skills/write-unit-test-go.md` → `.../write-unit-test-go/SKILL.md`

- [ ] **Step 1: Move files**

```bash
cd stacks/go/skills
for name in create-usecase-go add-endpoint-gin write-unit-test-go; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter for each**

For `stacks/go/skills/create-usecase-go/SKILL.md`:

```yaml
---
name: create-usecase-go
description: Scaffold a new Use Case following Clean Architecture in a Go project.
metadata:
  skill_type: micro
  stack: go
---
```

For `stacks/go/skills/add-endpoint-gin/SKILL.md`:

```yaml
---
name: add-endpoint-gin
description: Add a new Gin HTTP endpoint wired to a Use Case, following Clean Architecture.
metadata:
  skill_type: micro
  stack: go
---
```

For `stacks/go/skills/write-unit-test-go/SKILL.md`:

```yaml
---
name: write-unit-test-go
description: Write a unit test for a Use Case or domain entity using the standard testing package in a Go project.
metadata:
  skill_type: micro
  stack: go
---
```

- [ ] **Step 3: Verify and commit**

```bash
find stacks/go/skills -type f | sort
git add stacks/go/skills
git commit -m "refactor(go): migrate skills to folder format"
```

---

## Task 12: Migrate react-mantine overlay skills to folder format

**Files:**
- Move: `stacks/react-mantine/skills/create-component-mantine.md` → `.../create-component-mantine/SKILL.md`
- Move: `stacks/react-mantine/skills/create-page-mantine.md` → `.../create-page-mantine/SKILL.md`
- Move: `stacks/react-mantine/skills/frontend-hooks-react-query.md` → `.../frontend-hooks-react-query/SKILL.md`

- [ ] **Step 1: Move files**

```bash
cd stacks/react-mantine/skills
for name in create-component-mantine create-page-mantine frontend-hooks-react-query; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter for each**

For `stacks/react-mantine/skills/create-component-mantine/SKILL.md`:

```yaml
---
name: create-component-mantine
description: Scaffold a new React component using Mantine UI primitives with typed props and a colocated test.
metadata:
  skill_type: micro
  stack: react-mantine
---
```

For `stacks/react-mantine/skills/create-page-mantine/SKILL.md`:

```yaml
---
name: create-page-mantine
description: Scaffold a new page component using Mantine layout primitives, wired to the router and data layer.
metadata:
  skill_type: micro
  stack: react-mantine
---
```

For `stacks/react-mantine/skills/frontend-hooks-react-query/SKILL.md`:

```yaml
---
name: frontend-hooks-react-query
description: Create a data-fetching hook using TanStack Query (React Query) for a backend endpoint.
metadata:
  skill_type: micro
  stack: react-mantine
---
```

- [ ] **Step 3: Verify and commit**

```bash
find stacks/react-mantine/skills -type f | sort
git add stacks/react-mantine/skills
git commit -m "refactor(react-mantine): migrate skills to folder format"
```

---

## Task 13: Migrate react-mui overlay skills to folder format

**Files:**
- Move: `stacks/react-mui/skills/create-component-mui.md` → `.../create-component-mui/SKILL.md`
- Move: `stacks/react-mui/skills/create-page-mui.md` → `.../create-page-mui/SKILL.md`

- [ ] **Step 1: Move files**

```bash
cd stacks/react-mui/skills
for name in create-component-mui create-page-mui; do
  mkdir -p "$name"
  git mv "$name.md" "$name/SKILL.md"
done
cd ../../..
```

- [ ] **Step 2: Update frontmatter for each**

For `stacks/react-mui/skills/create-component-mui/SKILL.md`:

```yaml
---
name: create-component-mui
description: Scaffold a new React component using Material UI primitives with typed props and a colocated test.
metadata:
  skill_type: micro
  stack: react-mui
---
```

For `stacks/react-mui/skills/create-page-mui/SKILL.md`:

```yaml
---
name: create-page-mui
description: Scaffold a new page component using Material UI layout primitives, wired to the router and data layer.
metadata:
  skill_type: micro
  stack: react-mui
---
```

- [ ] **Step 3: Verify and commit**

```bash
find stacks/react-mui/skills -type f | sort
git add stacks/react-mui/skills
git commit -m "refactor(react-mui): migrate skills to folder format"
```

---

## Task 14: Rewrite `core/AGENTS.md.tmpl` as universal source of truth

**Files:**
- Modify: `core/AGENTS.md.tmpl`

- [ ] **Step 1: Replace the file completely with the new universal template**

Write file `core/AGENTS.md.tmpl` with this content:

```markdown
# {{project.name}}

Stack: **{{stack.label}}**

## Architecture

- **New code:** `{{layout}}` — Clean Architecture
- **Shared:** `src/@shared/` — base classes, error handling, utilities

## Critical Rules

- NEVER import infrastructure concerns in `domain/` or `application/` layers
- ALWAYS write unit tests for new Use Cases — test BEFORE implementation (TDD)
- NEVER add business logic to Controllers (HTTP coordination only)
- Commit convention: `type(scope): imperative message\n\nRefs #NN`. Types: feat, fix, test, refactor, docs, chore
- Only commit files directly related to the task — never `git add -A`

## Skills

Available procedural skills live in `.agents/skills/`:

- `_core/write-adr` — write an Architecture Decision Record
- `_core/write-spec` — write a user story with acceptance criteria
- `_core/write-readme` — create or update a README
- `_core/enforce-boundary` — verify Clean Architecture boundaries (constraint)
- `{{stack.base}}/*` — stack-specific skills (load from the directory)

Each skill is a folder with a `SKILL.md` file. Tools with native skill support read them from `.agents/skills/` directly (Codex, Gemini, Cursor) or via a symlink (Claude Code → `.claude/skills/`, Copilot → `.github/skills/`).

## Memory

See `memory/MEMORY.md` for architectural decisions, known issues, and confirmed patterns.

## Fallback

If a referenced file or skill does not exist:

1. Report the missing reference briefly
2. Use the best alternative available in the repo
3. Record the assumption in the task log
```

- [ ] **Step 2: Verify rendered output size**

Create a quick sanity check:

```bash
wc -l core/AGENTS.md.tmpl
```

Expected: 35-45 lines (well under the 60-line target).

- [ ] **Step 3: Commit**

```bash
git add core/AGENTS.md.tmpl
git commit -m "feat(core): rewrite AGENTS.md.tmpl as universal source of truth"
```

---

## Task 15: Rewrite `core/CLAUDE.md.tmpl` as thin reference

**Files:**
- Modify: `core/CLAUDE.md.tmpl`

- [ ] **Step 1: Replace the file completely**

Write `core/CLAUDE.md.tmpl`:

```markdown
# {{project.name}}

Stack: **{{stack.label}}**

See `AGENTS.md` for architecture, critical rules, and the skill catalog. Do not duplicate those rules here.

## Commands

```bash
{{cmdBlock}}
```

## Context Engineering (Main Agent Discipline)

The main agent is an **orchestrator**, not an executor.

- Coordinate files, dispatch subagents, consolidate summaries, communicate status
- NEVER explore the codebase broadly from the main context — dispatch a subagent
- NEVER implement large changes alone — delegate implementation to subagents in fresh context
- NEVER process long terminal output in the main context — filter or summarize first

### Subagent communication protocol

- Every subagent prompt ends with: "Return a structured summary with the following fields: [list]"
- Target 10-20 actionable lines per subagent return
- Chain subagents by passing only the relevant extracted fields between steps

<!-- Model selection matrix — added in next iteration -->

## Memory

See `memory/MEMORY.md` for decisions, patterns, and known issues.
```

- [ ] **Step 2: Verify size**

```bash
wc -l core/CLAUDE.md.tmpl
```

Expected: 30-40 lines.

- [ ] **Step 3: Commit**

```bash
git add core/CLAUDE.md.tmpl
git commit -m "refactor(core): rewrite CLAUDE.md.tmpl as thin reference to AGENTS.md"
```

---

## Task 16: Create `core/GEMINI.md.tmpl` stub

**Files:**
- Create: `core/GEMINI.md.tmpl`

- [ ] **Step 1: Write the file**

```markdown
# {{project.name}}

Stack: **{{stack.label}}**

See `AGENTS.md` for architecture, critical rules, and the skill catalog. This file exists so that Gemini CLI reads project context on session start; all rules live in AGENTS.md.

## Memory

See `memory/MEMORY.md` for decisions, patterns, and known issues.
```

- [ ] **Step 2: Commit**

```bash
git add core/GEMINI.md.tmpl
git commit -m "feat(core): add GEMINI.md.tmpl stub"
```

---

## Task 17: Create `core/.github/copilot-instructions.md.tmpl` stub

**Files:**
- Create: `core/.github/copilot-instructions.md.tmpl`

- [ ] **Step 1: Create the `.github` directory and file**

```bash
mkdir -p core/.github
```

Write `core/.github/copilot-instructions.md.tmpl`:

```markdown
# {{project.name}} — Copilot Instructions

Stack: **{{stack.label}}**

See `AGENTS.md` (project root) for architecture, critical rules, and the skill catalog. This file exists so GitHub Copilot picks up project context; all rules live in AGENTS.md — do not duplicate them here.

For Copilot-specific scoped rules (e.g., `applyTo` globs), add files under `.github/instructions/` — not this file.

## Memory

See `memory/MEMORY.md` for decisions, patterns, and known issues.
```

- [ ] **Step 2: Commit**

```bash
git add core/.github
git commit -m "feat(core): add copilot-instructions.md.tmpl stub"
```

---

## Task 18: Create `core/.cursorrules.tmpl` stub

**Files:**
- Create: `core/.cursorrules.tmpl`

- [ ] **Step 1: Write the file**

```markdown
# {{project.name}} — Cursor Rules

Stack: **{{stack.label}}**

See `AGENTS.md` (project root) for architecture, critical rules, and the skill catalog. All rules live in AGENTS.md — do not duplicate them here.

## Memory

See `memory/MEMORY.md` for decisions, patterns, and known issues.
```

- [ ] **Step 2: Commit**

```bash
git add core/.cursorrules.tmpl
git commit -m "feat(core): add .cursorrules.tmpl stub"
```

---

## Task 19: Create `core/README.md.tmpl` human guide

**Files:**
- Create: `core/README.md.tmpl`

- [ ] **Step 1: Write the file**

```markdown
# {{project.name}}

**{{stack.label}}** project scaffolded with [create-agents-workflow](https://github.com/josenaldo/agents-workflow-template).

## Multi-Agent Context Files

This repo uses a three-layer context-engineering structure:

### Layer 1 — Universal (`AGENTS.md`)

The project's constitution. Lists architecture, critical rules, skill catalog, and a memory pointer. Read natively by Codex, Gemini, and Cursor; a fallback for Claude.

### Layer 2 — Tool-specific (thin references)

- `CLAUDE.md` — Claude Code
- `GEMINI.md` — Gemini CLI
- `.github/copilot-instructions.md` — GitHub Copilot
- `.cursorrules` — Cursor

Each file is a thin reference to `AGENTS.md` plus tool-specific notes (e.g., commands, main-agent discipline). **Rules are not duplicated** — a rule change goes into `AGENTS.md` once.

### Layer 3 — Skills (`.agents/skills/`)

Procedural knowledge loaded on demand. Each skill is a folder:

```
.agents/skills/{name}/
├── SKILL.md              # required
├── references/           # optional; long examples
├── scripts/              # optional; executable verification
└── assets/               # optional; templates, fixtures
```

`.claude/skills/` and `.github/skills/` are **symlinks** to `.agents/skills/` so native tool discovery works. On Windows without symlink support, they are copies (edit only the canonical `.agents/skills/` and re-run scaffold to sync).

## Memory

Architectural decisions and confirmed patterns live in `memory/MEMORY.md`.

## Commands

```bash
{{cmdBlock}}
```
```

- [ ] **Step 2: Commit**

```bash
git add core/README.md.tmpl
git commit -m "feat(core): add README.md.tmpl human guide to Layer 1/2/3"
```

---

## Task 20: Update `bin/create.js` to render skills from `.agents/skills/` and filter by agent

**Files:**
- Modify: `bin/create.js`

The existing CLI copies `core/.claude/skills/_core/` to the project. We now:
1. Copy from `core/.agents/skills/_core/` into `{target}/.agents/skills/_core/`
2. Copy stack skills from `stacks/{stack}/skills/` into `{target}/.agents/skills/{stack}/`
3. Filter Layer 2 files (CLAUDE.md, GEMINI.md, etc.) based on `requestedAgents`
4. Invoke `createSymlinks()` after copy

- [ ] **Step 1: Read the current scaffold logic**

Look at `bin/create.js` lines ~222-290 (the section after "Scaffold" that calls `copyTree(CORE, targetDir, context)`).

- [ ] **Step 2: Replace scaffold logic with per-file filtering**

Replace the block starting with `await copyTree(CORE, targetDir, context);` through the end of the stack loop (before the `writeFile(... stack.resolved.json)` call) with:

```js
  // Copy the core templates, filtered by agent selection.
  await copyCoreFiltered(CORE, targetDir, context, requestedAgents);
  if (s) s.stop('Core copied.');

  // Copy stack skills and templates.
  for (const stack of selectedStacks) {
    if (s) s.start(`Applying stack: ${stack.name}`);
    else log(`Applying stack: ${stack.name}...`);

    const templatesDir = join(stack.dir, 'templates');
    if (existsSync(templatesDir)) {
      await copyTree(templatesDir, targetDir, context);
    }

    // Stack skills → .agents/skills/{stack-name}/
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(targetDir, '.agents', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }

    const gitignore = join(stack.dir, 'gitignore.append');
    if (existsSync(gitignore)) {
      await appendFile(gitignore, join(targetDir, '.gitignore'));
    }
    if (s) s.stop(`Applied: ${stack.name}`);
  }

  // Create symlinks for agents that expect a native skills directory.
  await createSymlinks(targetDir, requestedAgents);
```

- [ ] **Step 3: Add `copyCoreFiltered` helper near the top of bin/create.js**

After the `ALL_AGENTS` constant, add:

```js
// Maps each agent to its Layer 2 template file, relative to CORE.
const AGENT_LAYER2_FILES = {
  claude: 'CLAUDE.md.tmpl',
  gemini: 'GEMINI.md.tmpl',
  copilot: '.github/copilot-instructions.md.tmpl',
  cursor: '.cursorrules.tmpl',
  // codex reads AGENTS.md natively — no Layer 2 stub
};

async function copyCoreFiltered(coreDir, targetDir, context, agents) {
  // Determine which Layer 2 files to skip based on non-selected agents.
  const enabledLayer2 = new Set();
  for (const a of agents) {
    if (AGENT_LAYER2_FILES[a]) enabledLayer2.add(AGENT_LAYER2_FILES[a]);
  }
  const allLayer2 = new Set(Object.values(AGENT_LAYER2_FILES));
  const skipRel = [...allLayer2].filter((p) => !enabledLayer2.has(p));

  await copyTree(coreDir, targetDir, context, { skipRelative: skipRel });
}
```

- [ ] **Step 4: Update `copyTree` in `lib/copy.js` to support the `skipRelative` option**

Modify `copyTree` signature in `lib/copy.js` from:

```js
export async function copyTree(from, to, context) {
```

to:

```js
export async function copyTree(from, to, context, options = {}) {
  const { skipRelative = [], _rel = '' } = options;
```

Inside the loop, after `const src = join(from, entry.name);` and `const dst = join(to, entry.name);`, add a computed relative path and skip check:

```js
    const relPath = _rel ? `${_rel}/${entry.name}` : entry.name;
    // Strip .tmpl for match — skip lists use the .tmpl form
    const relPathWithTmpl = relPath; // preserved for skip matching
    if (skipRelative.includes(relPathWithTmpl)) continue;
```

And update the recursive call from:

```js
      await copyTree(src, dst, context);
```

to:

```js
      await copyTree(src, dst, context, { ...options, _rel: relPath });
```

- [ ] **Step 5: Verify syntax**

Run: `node --check bin/create.js && node --check lib/copy.js`

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add bin/create.js lib/copy.js
git commit -m "feat(cli): filter Layer 2 files by --agents and copy skills to .agents/skills/"
```

---

## Task 21: Update existing scaffold tests to expect new paths

**Files:**
- Modify: `test/scaffold.test.js`

The existing tests expect `.claude/skills/_core/*.md` and `.claude/skills/{stack}/{skill}.md`. They must now expect `.agents/skills/_core/{name}/SKILL.md` and `.agents/skills/{stack}/{name}/SKILL.md`, plus validate that `.claude/skills/` is a symlink.

- [ ] **Step 1: Update the `scaffoldProject` helper to copy from new stack paths**

In `test/scaffold.test.js`, the `scaffoldProject` helper already loops stacks and copies their `skills/` directory. It now copies folders, which is what we want — no logic change needed.

But it copies to `{dir}/.claude/skills/{stack}` (line ~60). Update that to `{dir}/.agents/skills/{stack}`. The relevant block currently reads:

```js
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(dir, '.claude', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }
```

Change to:

```js
    const skillsDir = join(stack.dir, 'skills');
    if (existsSync(skillsDir)) {
      const dst = join(dir, '.agents', 'skills', stack.name);
      await mkdir(dst, { recursive: true });
      await copyTree(skillsDir, dst, context);
    }
```

- [ ] **Step 2: Also import `createSymlinks` and call it after copying**

Add `createSymlinks` to the imports from `../lib/copy.js`:

```js
import { copyTree, appendFile, createSymlinks } from '../lib/copy.js';
```

At the end of the `scaffoldProject` helper, just before the `return` statement, add:

```js
  await createSymlinks(dir, ['claude', 'copilot']);
```

- [ ] **Step 3: Update the "generates core skills" test**

Replace:

```js
    it('generates core skills', async () => {
      const coreSkills = join(dir, '.claude', 'skills', '_core');
      assert.ok(await dirExists(coreSkills), 'Core skills directory should exist');
      const files = await readdir(coreSkills);
      assert.ok(files.includes('write-adr.md'), 'Should have write-adr skill');
      assert.ok(files.includes('write-spec.md'), 'Should have write-spec skill');
      assert.ok(files.includes('enforce-boundary.md'), 'Should have enforce-boundary skill');
    });
```

with:

```js
    it('generates core skills as folders with SKILL.md', async () => {
      const coreSkills = join(dir, '.agents', 'skills', '_core');
      assert.ok(await dirExists(coreSkills), 'Core skills directory should exist');
      for (const name of ['write-adr', 'write-spec', 'write-readme', 'enforce-boundary']) {
        assert.ok(await dirExists(join(coreSkills, name)), `${name} directory should exist`);
        assert.ok(existsSync(join(coreSkills, name, 'SKILL.md')), `${name}/SKILL.md should exist`);
      }
    });
```

- [ ] **Step 4: Update the "copies stack-specific skills" test**

Replace:

```js
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
```

with:

```js
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
```

- [ ] **Step 5: Update the react-mantine overlay test that checks skill files**

Find this block:

```js
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
```

Replace with:

```js
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
```

And the react-mui overlay test (same pattern):

```js
  it('copies overlay skills', async () => {
    const overlaySkillsDir = join(dir, '.agents', 'skills', 'react-mui');
    assert.ok(await dirExists(overlaySkillsDir), 'Overlay skills dir should exist');
    for (const skill of ['create-component-mui', 'create-page-mui']) {
      assert.ok(existsSync(join(overlaySkillsDir, skill, 'SKILL.md')), `${skill}/SKILL.md should exist`);
    }
  });
```

- [ ] **Step 6: Run tests to verify all existing assertions pass**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: all tests pass (76 tests or similar count; no regressions).

- [ ] **Step 7: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: update scaffold tests for .agents/skills/ folder format"
```

---

## Task 22: Add test suite for multi-agent Layer 2 output

**Files:**
- Modify: `test/scaffold.test.js`

- [ ] **Step 1: Add helper + new describe block near the end of scaffold.test.js**

Before the final close of the file, insert:

```js
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
```

- [ ] **Step 2: The `scaffoldProject` helper currently uses a hard-coded agent list. Make it accept an override.**

Update the helper signature to accept an `agents` parameter:

```js
async function scaffoldProject(baseName, overlayName = null, agents = ['claude', 'codex', 'gemini', 'copilot', 'cursor']) {
```

Pass the list to `createSymlinks`:

```js
  await createSymlinks(dir, agents);
```

And add a new step that mimics the CLI's Layer 2 filtering — for now leave all Layer 2 files copied (the filtering test below exercises the filtered path separately).

- [ ] **Step 3: Run tests to verify the new assertions pass**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: `# pass 82+` and `# fail 0`.

- [ ] **Step 4: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: add multi-agent Layer 2 output assertions"
```

---

## Task 23: Add test suite for `--agents` filter

**Files:**
- Modify: `test/scaffold.test.js`

- [ ] **Step 1: Refactor `scaffoldProject` to apply the Layer 2 filter matching the CLI**

The current helper does not filter Layer 2 files when `agents` is restricted. Implement the same filtering the CLI does by computing `skipRelative` and passing it to `copyTree`.

Near the top of `test/scaffold.test.js`, after the imports, add:

```js
const AGENT_LAYER2_FILES = {
  claude: 'CLAUDE.md.tmpl',
  gemini: 'GEMINI.md.tmpl',
  copilot: '.github/copilot-instructions.md.tmpl',
  cursor: '.cursorrules.tmpl',
};
```

Inside the `scaffoldProject` helper, update the `copyTree(CORE, dir, context)` call to:

```js
  const enabledLayer2 = new Set();
  for (const a of agents) if (AGENT_LAYER2_FILES[a]) enabledLayer2.add(AGENT_LAYER2_FILES[a]);
  const allLayer2 = new Set(Object.values(AGENT_LAYER2_FILES));
  const skipRel = [...allLayer2].filter((p) => !enabledLayer2.has(p));

  await copyTree(CORE, dir, context, { skipRelative: skipRel });
```

- [ ] **Step 2: Add the filter test suite**

Append to `test/scaffold.test.js`:

```js
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
```

- [ ] **Step 3: Run tests**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: all tests pass (~87 tests).

- [ ] **Step 4: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: assert --agents filter excludes non-requested Layer 2 files"
```

---

## Task 24: Add test for symlinks (Linux/macOS)

**Files:**
- Modify: `test/scaffold.test.js`

- [ ] **Step 1: Add symlink test block**

Append:

```js
describe('multi-agent: symlinks point to .agents/skills (Unix)', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('.claude/skills is a symlink to ../.agents/skills', async () => {
    if (process.platform === 'win32') return; // skipped on Windows
    const { lstat, readlink } = await import('node:fs/promises');
    const linkPath = join(dir, '.claude', 'skills');
    const stat = await lstat(linkPath);
    assert.ok(stat.isSymbolicLink(), '.claude/skills must be a symlink');
    const target = await readlink(linkPath);
    assert.equal(target, '../.agents/skills');
  });

  it('.github/skills is a symlink to ../.agents/skills', async () => {
    if (process.platform === 'win32') return;
    const { lstat, readlink } = await import('node:fs/promises');
    const linkPath = join(dir, '.github', 'skills');
    const stat = await lstat(linkPath);
    assert.ok(stat.isSymbolicLink());
    const target = await readlink(linkPath);
    assert.equal(target, '../.agents/skills');
  });

  it('resolved symlink path contains SKILL.md files', async () => {
    if (process.platform === 'win32') return;
    const { readdir } = await import('node:fs/promises');
    const resolved = join(dir, '.claude', 'skills', '_core');
    const entries = await readdir(resolved, { withFileTypes: true });
    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    assert.ok(dirs.includes('write-adr'));
    assert.ok(dirs.includes('enforce-boundary'));
  });
});
```

- [ ] **Step 2: Run tests**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: assert .claude/skills and .github/skills are symlinks"
```

---

## Task 25: Add test for skill frontmatter validity

**Files:**
- Modify: `test/scaffold.test.js`

- [ ] **Step 1: Add a minimal YAML frontmatter parser helper**

Near the top of `test/scaffold.test.js`, after existing helpers, add:

```js
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
      // nested under metadata
      const nm = line.match(/^\s+([a-zA-Z_-]+):\s*(.*)$/);
      if (currentKey === 'metadata') {
        result.metadata = result.metadata || {};
        result.metadata[nm[1]] = nm[2].trim();
      }
    }
  }
  return result;
}
```

Add `readFile` to imports:

```js
import { mkdir, rm, readFile, readdir, stat } from 'node:fs/promises';
```

- [ ] **Step 2: Add frontmatter validation test block**

Append:

```js
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
```

- [ ] **Step 3: Run tests**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: assert every SKILL.md has valid frontmatter"
```

---

## Task 26: Add test for size budgets on AGENTS.md and CLAUDE.md

**Files:**
- Modify: `test/scaffold.test.js`

- [ ] **Step 1: Add size budget test block**

Append:

```js
describe('size budgets: AGENTS.md and CLAUDE.md stay lean', () => {
  let dir;

  before(async () => {
    ({ dir } = await scaffoldProject('ts-node-npm'));
    cleanupDirs.push(dir);
  });

  it('AGENTS.md is <= 80 lines (target 60 with buffer)', async () => {
    const content = await fileContent(join(dir, 'AGENTS.md'));
    const lines = content.split('\n').length;
    assert.ok(lines <= 80, `AGENTS.md has ${lines} lines (limit 80)`);
  });

  it('CLAUDE.md is <= 100 lines (target 80 with buffer)', async () => {
    const content = await fileContent(join(dir, 'CLAUDE.md'));
    const lines = content.split('\n').length;
    assert.ok(lines <= 100, `CLAUDE.md has ${lines} lines (limit 100)`);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `node --test test/**/*.test.js 2>&1 | tail -12`

Expected: all pass. If AGENTS.md or CLAUDE.md exceeds the budget, trim them per the spec's §3.1 / §3.2.

- [ ] **Step 3: Commit**

```bash
git add test/scaffold.test.js
git commit -m "test: enforce size budgets on AGENTS.md (80) and CLAUDE.md (100)"
```

---

## Task 27: Manual dry-run verification

**Files:** none (verification only)

- [ ] **Step 1: Dry-run ts-node-npm**

Run: `node bin/create.js /tmp/ccw-dryrun-1 --stack ts-node-npm --dry-run`

Expected: output lists AGENTS.md, CLAUDE.md, GEMINI.md, copilot-instructions.md, .cursorrules, README.md, .agents/skills/_core/, .agents/skills/ts-node-npm/, stack.resolved.json.

- [ ] **Step 2: Real scaffold ts-node-npm + react-mantine**

Run: `node bin/create.js /tmp/ccw-real-1 --stack ts-node-npm --overlay react-mantine --yes`

- [ ] **Step 3: Verify resulting file tree**

Run:

```bash
find /tmp/ccw-real-1 -maxdepth 3 -type f | sort
ls -la /tmp/ccw-real-1/.claude /tmp/ccw-real-1/.github
```

Expected:
- All Layer 2 files present at root (AGENTS.md, CLAUDE.md, GEMINI.md, .cursorrules)
- `.github/copilot-instructions.md` exists
- `.agents/skills/_core/` with 4 skill folders
- `.agents/skills/ts-node-npm/` with 3 skill folders
- `.agents/skills/react-mantine/` with 3 skill folders
- `.claude/skills` and `.github/skills` are symlinks (check with `ls -la`: should show `->`)

- [ ] **Step 4: Verify AGENTS.md catalog lists stack-relative skills**

Run: `cat /tmp/ccw-real-1/AGENTS.md`

Expected: `## Skills` section mentions the stack (it uses `{{stack.base}}/*` placeholder; render should show `ts-node-npm/*`).

- [ ] **Step 5: Dry-run with --agents claude**

Run: `node bin/create.js /tmp/ccw-dryrun-2 --stack go --agents claude --dry-run`

Expected: dry-run output indicates CLAUDE.md present but GEMINI.md, copilot-instructions.md, .cursorrules NOT listed.

- [ ] **Step 6: Real scaffold with --agents claude**

Run: `node bin/create.js /tmp/ccw-real-2 --stack go --agents claude --yes`

Verify: `ls /tmp/ccw-real-2/` shows only AGENTS.md, CLAUDE.md, README.md (no GEMINI.md, no .cursorrules); `.github/copilot-instructions.md` absent; `.github/skills` absent (no symlink for copilot); `.claude/skills` exists as symlink.

- [ ] **Step 7: Clean up**

```bash
rm -rf /tmp/ccw-dryrun-1 /tmp/ccw-dryrun-2 /tmp/ccw-real-1 /tmp/ccw-real-2
```

No commit (verification only).

---

## Task 28: Final full test run + handoff to Plan 2

**Files:** none

- [ ] **Step 1: Run the full test suite**

Run: `node --test test/**/*.test.js 2>&1 | tail -15`

Expected: `# pass` count ≥ 85 (baseline 76 + ~10 new), `# fail 0`.

- [ ] **Step 2: Run a quick `npm pack --dry-run` to confirm the package is clean**

Run: `npm pack --dry-run 2>&1 | tail -20`

Expected: tarball lists `core/.agents/skills/_core/{name}/SKILL.md` (not `.claude/skills/...`), includes new template files (`GEMINI.md.tmpl`, `README.md.tmpl`, `.cursorrules.tmpl`, `.github/copilot-instructions.md.tmpl`), and includes the new folder-format stack skills.

- [ ] **Step 3: Write a short handoff note for Plan 2**

Append to the bottom of the plan file (or commit a new file `docs/superpowers/plans/2026-04-17-multi-agent-pivot-plan-1-handoff.md`) with:

```markdown
# Plan 1 Handoff

Plan 1 (infrastructure pivot) is complete on branch `feature/multi-agent-pivot-infrastructure`. The package is structurally ready for multi-agent: new skill layout, symlinks, --agents flag, Layer 1/2 templates.

**Not yet done (Plan 2):**
1. Rewrite 21 skills in the full English format (Instructions / Critical / Examples / Troubleshooting / Performance Notes / See also)
2. Publish @josenaldo/create-agents-workflow@1.0.0 to npm
3. Deprecate @josenaldo/create-claude-workflow (README banner + `npm deprecate`)
4. Rename GitHub repo claude-workflow-template → agents-workflow-template
5. Rename local directory

Current state:
- Branch: feature/multi-agent-pivot-infrastructure (not yet merged to master)
- Version: 1.0.0-0 (pre-release, not published)
- Tests: [insert actual pass count]
```

- [ ] **Step 4: Commit handoff + merge branch (optional)**

```bash
git add docs/superpowers/plans/2026-04-17-multi-agent-pivot-plan-1-handoff.md
git commit -m "docs: Plan 1 handoff notes"
```

Optionally merge to master or leave the branch open for Plan 2 to build on.

---

## Next Steps

After Plan 1 is executed and verified, invoke `superpowers:writing-plans` again to produce **Plan 2** (skill content rewrites + v1.0.0 publish + deprecation + repo rename).

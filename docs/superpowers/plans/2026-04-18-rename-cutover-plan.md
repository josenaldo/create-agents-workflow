# Rename Cutover Plan

> **Scope:** procedural checklist for executing the package/repo/directory rename from `claude-workflow-template` → `agents-workflow-template` and cutting over `@josenaldo/create-claude-workflow` → `@josenaldo/create-agents-workflow`. This plan runs **after** Plan 2 (skill content rewrites) is complete.

**Goal:** Publicly switch everything that still references the old name to the new name, publish `@josenaldo/create-agents-workflow@1.0.0`, deprecate the old package, and preserve Claude Code session memory through the local directory rename.

**Dependencies:**

- Plan 1 (infrastructure pivot) must be merged to `master`
- Plan 2 (skill content rewrites) must be complete on its own branch and tests green
- The working tree must be clean; no uncommitted changes

---

## Preconditions (check before starting)

- [ ] **Step 0.1: Verify current branch and status**

Run: `git status && git branch --show-current`

Expected: working tree clean; on `master` or the final feature branch from Plan 2.

- [ ] **Step 0.2: Verify test suite is green**

Run: `node --test test/**/*.test.js 2>&1 | tail -10`

Expected: `# fail 0`.

- [ ] **Step 0.3: Verify npm login**

Run: `npm whoami`

Expected: `josenaldo`. If not logged in: `npm login` first.

- [ ] **Step 0.4: Verify the target name is available on npm**

Run: `npm view @josenaldo/create-agents-workflow 2>&1 | head -3`

Expected: `npm error code E404` (name available).

---

## Phase 1: Clean up residual old-name references in the repo

These items still reference `create-claude-workflow` or `claude-workflow-template` inside the repo. Fix them before publish.

### Task 1: Fix the bail() message in bin/create.js

**Files:**
- Modify: `bin/create.js:127`

- [ ] **Step 1: Update the error message**

In `bin/create.js`, replace:

```js
      bail('Project name is required with --yes/--dry-run. Usage: create-claude-workflow <name> --stack <stack> [--yes|--dry-run]');
```

with:

```js
      bail('Project name is required with --yes/--dry-run. Usage: create-agents-workflow <name> --stack <stack> [--yes|--dry-run]');
```

- [ ] **Step 2: Verify no other `create-claude-workflow` strings remain in bin/**

Run: `grep -rn "create-claude-workflow" bin/ lib/ || echo "clean"`

Expected: `clean`.

- [ ] **Step 3: Commit**

```bash
git add bin/create.js
git commit -m "fix(cli): update bail() message to use new package name"
```

### Task 2: Rewrite README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the README with the multi-agent version**

Write `README.md`:

```markdown
# create-agents-workflow

Scaffolds a **multi-agent workflow** (AGENTS.md + per-agent references + skills + memory + command mapping) into any project, tailored to the chosen stack. Supports Claude Code, Codex, Gemini CLI, GitHub Copilot, and Cursor.

## Usage

```bash
# Interactive (prompts for everything)
npx @josenaldo/create-agents-workflow

# Current directory
npx @josenaldo/create-agents-workflow .

# Non-interactive (scriptable)
npx @josenaldo/create-agents-workflow my-app --stack ts-node-npm --yes

# Preview without writing
npx @josenaldo/create-agents-workflow my-app --stack go --dry-run

# Limit to specific agents (default: all)
npx @josenaldo/create-agents-workflow my-app --stack ts-node-npm --agents claude,codex
```

### Options

| Flag               | Short | Description                                                           |
| ------------------ | ----- | --------------------------------------------------------------------- |
| `--yes`            | `-y`  | Accept all defaults (non-interactive)                                 |
| `--stack <name>`   |       | Base stack (skip prompt)                                              |
| `--overlay <name>` |       | Frontend overlay or `none` (skip prompt)                              |
| `--agents <list>`  |       | Comma-separated: `claude,codex,gemini,copilot,cursor` (default: all)  |
| `--dry-run`        |       | Show what would be generated without writing                          |
| `--help`           | `-h`  | Show help                                                             |

### Interactive mode

Without flags, the CLI asks:

- **Project name** (or `.` for current directory)
- **Base stack** (one of: `ts-node-npm`, `js-node-npm`, `java-gradle`, `java-spring-gradle`, `python-uv`, `go`)
- **Frontend overlay** (optional: `react-mantine`, `react-mui`, or none)
- **Init git / initial commit**
- **Seed memory/** directory

Then it:

1. Copies the agnostic `core/` (AGENTS.md, per-agent Layer 2 stubs, workflow docs, memory scaffolding, README)
2. Applies the selected stack overlay(s) — merges `stack.json`, copies skill folders to `.agents/skills/{stack}/`, appends stack-specific `.gitignore` entries
3. Renders all `{{placeholders}}` (project name, stack label, commands, layout)
4. Creates symlinks so Claude Code (`.claude/skills/`) and Copilot (`.github/skills/`) discover skills natively

## Architecture

Generated projects follow a three-layer context-engineering structure:

- **Layer 1** — `AGENTS.md`: universal source of truth (architecture, critical rules, skill catalog). Read by Codex, Gemini, Cursor natively; Claude fallback.
- **Layer 2** — per-agent thin references: `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules`. Each points to AGENTS.md; no rule duplication.
- **Layer 3** — `.agents/skills/{name}/SKILL.md`: procedural skills loaded on demand. Symlinks in `.claude/skills/` and `.github/skills/` target this canonical directory.

See [docs/superpowers/specs/2026-04-17-multi-agent-pivot-design.md](docs/superpowers/specs/2026-04-17-multi-agent-pivot-design.md) for the full design.

### Stacks

| Stack                | Kind    | Status   |
| -------------------- | ------- | -------- |
| `ts-node-npm`        | base    | skills   |
| `js-node-npm`        | base    | manifest |
| `java-gradle`        | base    | manifest |
| `java-spring-gradle` | base    | skills   |
| `python-uv`          | base    | skills   |
| `go`                 | base    | skills   |
| `react-mantine`      | overlay | skills   |
| `react-mui`          | overlay | skills   |

"Manifest" = `stack.json` defines commands and layout, but no stack-specific skills yet. "Skills" = manifest + stack-specific skills (create-usecase, add-endpoint, write-unit-test, etc.). The agnostic core always applies.

## Adding a new stack

1. Create `stacks/<name>/stack.json` with `commands`, `layout`, `testFramework`.
2. (Optional) add `stacks/<name>/skills/<skill-name>/SKILL.md` for stack-specific skills (folder format).
3. (Optional) add `stacks/<name>/templates/` for code scaffolding rendered into the new project.
4. (Optional) add `stacks/<name>/gitignore.append` for lines to append to `.gitignore`.

If `kind: "overlay"` in `stack.json`, the CLI will require a compatible base (declared via `requires`).

## Migration from `@josenaldo/create-claude-workflow`

`@josenaldo/create-claude-workflow` (v0.1.x) was the Claude-only predecessor and is now deprecated. Switch to `@josenaldo/create-agents-workflow`:

```bash
npx @josenaldo/create-agents-workflow my-project
```

The generated project is multi-agent by default. If you want to keep the Claude-only footprint, pass `--agents claude`.

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: rewrite README for multi-agent pivot"
```

### Task 3: Regenerate package-lock.json

**Files:**
- Modify: `package-lock.json`

- [ ] **Step 1: Delete and regenerate**

```bash
rm package-lock.json
npm install
```

Expected: new `package-lock.json` with `"name": "@josenaldo/create-agents-workflow"` at lines 2, 8, and 16.

- [ ] **Step 2: Verify**

Run: `grep -n "create-" package-lock.json | head -5`

Expected: only matches like `@josenaldo/create-agents-workflow`, no `create-claude-workflow`.

- [ ] **Step 3: Commit**

```bash
git add package-lock.json
git commit -m "chore: regenerate package-lock.json with new package name"
```

### Task 4: Bump version to 1.0.0 (release)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the version field**

In `package.json`, change:

```json
  "version": "1.0.0-0",
```

to:

```json
  "version": "1.0.0",
```

- [ ] **Step 2: Run tests one more time**

Run: `node --test test/**/*.test.js 2>&1 | tail -10`

Expected: `# fail 0`.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: bump to 1.0.0 for initial release"
```

---

## Phase 2: Rename the GitHub repo

**⚠ This changes the remote URL. Done via web UI.**

### Task 5: Rename the GitHub repository

- [ ] **Step 1: Go to the repo Settings page**

URL: `https://github.com/josenaldo/claude-workflow-template/settings`

- [ ] **Step 2: Rename**

In the "Repository name" field, change from `claude-workflow-template` to `agents-workflow-template`. Click "Rename".

GitHub automatically sets up redirects from the old URL, so issues/PRs/stars are preserved. Old `git clone` URLs will still work (with a warning).

- [ ] **Step 3: Update the local git remote**

```bash
git remote set-url origin git@github.com:josenaldo/agents-workflow-template.git
git remote -v
```

Expected: both fetch and push show the new URL.

- [ ] **Step 4: Verify push works**

```bash
git push origin --dry-run
```

Expected: no errors.

---

## Phase 3: Publish the new npm package

### Task 6: Publish `@josenaldo/create-agents-workflow@1.0.0`

- [ ] **Step 1: Verify pack contents**

```bash
npm pack --dry-run 2>&1 | tail -30
```

Expected: tarball includes `bin/`, `lib/`, `core/`, `stacks/`, `README.md`, `LICENSE`, `package.json`. No `test/`, no `.git`, no `docs/`, no `node_modules/`.

- [ ] **Step 2: Publish**

```bash
npm publish
```

If 2FA is enabled, npm will prompt for an OTP or open a browser auth flow.

Expected: `+ @josenaldo/create-agents-workflow@1.0.0`.

- [ ] **Step 3: Verify on the registry**

```bash
npm view @josenaldo/create-agents-workflow version
```

Expected: `1.0.0`.

- [ ] **Step 4: Sanity check the published tarball**

```bash
npx @josenaldo/create-agents-workflow --help
```

Expected: help text prints with the new banner.

- [ ] **Step 5: Push the 1.0.0 commit to GitHub**

```bash
git push origin master
git tag v1.0.0
git push origin v1.0.0
```

---

## Phase 4: Deprecate the old npm package

The old package `@josenaldo/create-claude-workflow@0.1.0` is still live. We publish a `0.1.1` with a deprecation banner in the README, then call `npm deprecate` to surface a warning on install.

### Task 7: Publish 0.1.1 with a deprecation banner

⚠ This requires switching to the old repo temporarily (or creating a throwaway working directory) because the old package's `name` and `repository` fields are different. Simplest approach: use a `git stash` + temporary edit.

- [ ] **Step 1: Create a temporary directory for the deprecation publish**

```bash
cd /tmp
git clone git@github.com:josenaldo/agents-workflow-template.git ccw-deprecate
cd ccw-deprecate
git checkout 98d05b8   # the last commit of the old package (v0.1.0)
```

(`98d05b8` is the bootstrap commit of the old package; adjust if your version tag differs.)

- [ ] **Step 2: Edit package.json back to the old name but bump to 0.1.1**

Edit `package.json` to set:

```json
{
  "name": "@josenaldo/create-claude-workflow",
  "version": "0.1.1",
  ...
}
```

- [ ] **Step 3: Prepend a deprecation banner to README.md**

Replace the top of `/tmp/ccw-deprecate/README.md` with:

```markdown
> ⚠ **DEPRECATED** — Use [`@josenaldo/create-agents-workflow`](https://www.npmjs.com/package/@josenaldo/create-agents-workflow) instead. It supports multi-agent workflows (Claude Code, Codex, Gemini, Copilot, Cursor) out of the box.
>
> ```bash
> npx @josenaldo/create-agents-workflow
> ```

# create-claude-workflow
```

- [ ] **Step 4: Publish 0.1.1**

```bash
npm publish
```

- [ ] **Step 5: Run `npm deprecate`**

```bash
npm deprecate '@josenaldo/create-claude-workflow@*' \
  'Use @josenaldo/create-agents-workflow — multi-agent support (Claude, Codex, Gemini, Copilot, Cursor).'
```

- [ ] **Step 6: Verify the deprecation shows up**

```bash
npm view @josenaldo/create-claude-workflow deprecated
```

Expected: the deprecation message prints.

- [ ] **Step 7: Clean up the temporary directory**

```bash
cd -
rm -rf /tmp/ccw-deprecate
```

---

## Phase 5: Rename the local directory

**⚠ Before renaming, finish any open Claude Code sessions in this directory. The rename breaks the Claude Code memory path until the memory directory is moved.**

### Task 8: Preserve Claude Code memory (CRITICAL)

Claude Code stores per-project memory at `~/.claude/projects/{slugified-path}/`. The slug is derived from the absolute path with `/` replaced by `-`. After renaming the local directory, the old slug becomes orphaned.

- [ ] **Step 1: Identify the old and new slugs**

```bash
OLD_SLUG="-home-josenaldo-repos-personal-claude-workflow-template"
NEW_SLUG="-home-josenaldo-repos-personal-agents-workflow-template"
```

- [ ] **Step 2: Verify the old slug exists**

```bash
ls -la "$HOME/.claude/projects/$OLD_SLUG" 2>&1 | head -5
```

Expected: directory listing.

### Task 9: Rename the local directory

- [ ] **Step 1: Move out of the directory first**

```bash
cd /home/josenaldo/repos/personal
```

- [ ] **Step 2: Rename**

```bash
mv claude-workflow-template agents-workflow-template
cd agents-workflow-template
```

- [ ] **Step 3: Verify git still works**

```bash
git status
```

Expected: clean working tree, on the current branch.

- [ ] **Step 4: Move Claude Code's memory directory**

```bash
mv "$HOME/.claude/projects/-home-josenaldo-repos-personal-claude-workflow-template" \
   "$HOME/.claude/projects/-home-josenaldo-repos-personal-agents-workflow-template"
```

If Claude Code is running, restart it so it picks up the new path.

- [ ] **Step 5: Verify the memory is accessible**

```bash
ls "$HOME/.claude/projects/-home-josenaldo-repos-personal-agents-workflow-template/" | head -5
```

Expected: directory listing with session files.

---

## Phase 6: Final verification

### Task 10: End-to-end smoke test

- [ ] **Step 1: Scaffold a project from the published package**

```bash
cd /tmp
npx @josenaldo/create-agents-workflow test-scaffold --stack ts-node-npm --agents claude,codex --yes
```

Expected: project created at `/tmp/test-scaffold/` with AGENTS.md, CLAUDE.md, `.claude/skills/` (symlink), `.agents/skills/_core/`, `.agents/skills/ts-node-npm/`. No GEMINI.md, no `.cursorrules`, no `.github/copilot-instructions.md`.

- [ ] **Step 2: Verify symlinks**

```bash
ls -la /tmp/test-scaffold/.claude/skills
```

Expected: `skills -> ../.agents/skills` (symlink).

- [ ] **Step 3: Inspect a skill**

```bash
cat /tmp/test-scaffold/.agents/skills/_core/write-adr/SKILL.md | head -15
```

Expected: valid frontmatter with `name`, `description`, `metadata.skill_type`.

- [ ] **Step 4: Clean up**

```bash
rm -rf /tmp/test-scaffold
```

### Task 11: Verify the deprecated package shows the warning

- [ ] **Step 1: Install the old package in a sandbox**

```bash
cd /tmp
mkdir ccw-install-test
cd ccw-install-test
npm init -y
npm install @josenaldo/create-claude-workflow 2>&1 | head -10
```

Expected: npm prints a deprecation warning pointing to `@josenaldo/create-agents-workflow`.

- [ ] **Step 2: Clean up**

```bash
cd ..
rm -rf ccw-install-test
```

---

## Phase 7: External references (manual)

These are outside the repo and you must update them yourself:

- [ ] **Blog post** — if `/home/josenaldo/repos/personal/josenaldo.github.io/content/blog/context-engineering-guia-completo.md` or any other blog post links the repo, update URLs from `claude-workflow-template` to `agents-workflow-template`. GitHub redirects old URLs indefinitely, so this is not urgent but nice to have.
- [ ] **Social media posts** — any tweets/posts announcing the old package: add a reply/pin pointing to the new package.
- [ ] **Other personal projects** — if other repos scaffold from this tool via automation (CI etc.), update their commands to use `@josenaldo/create-agents-workflow`.
- [ ] **Talks / slides / docs** — any external documentation that mentions the old name.

---

## Rollback notes

If something goes wrong mid-cutover:

- **New package published but broken:** run `npm unpublish @josenaldo/create-agents-workflow@1.0.0` within 72 hours. After 72 hours, publish `1.0.1` with the fix.
- **GitHub rename undo:** GitHub allows renaming back in Settings. Redirect URLs are preserved either way.
- **Local directory rename undo:** `mv` the directory back. Remember to also move the Claude Code memory directory back.

## Done criteria

- [ ] All tasks above executed and verified
- [ ] `npm view @josenaldo/create-agents-workflow version` → `1.0.0`
- [ ] `npm view @josenaldo/create-claude-workflow deprecated` → deprecation message
- [ ] `git remote -v` → `agents-workflow-template`
- [ ] Local directory is at `/home/josenaldo/repos/personal/agents-workflow-template`
- [ ] Claude Code memory directory moved
- [ ] Smoke test (Task 10) passes
- [ ] Deprecation warning shows on install (Task 11)

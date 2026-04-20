# Project Pivot State — Memory

> **Purpose:** Everything to remember about the multi-agent pivot across sessions, especially when the local directory is renamed and Claude Code memory needs to migrate.

**Last updated:** 2026-04-18

---

## Current state

- **Branch:** `feature/multi-agent-pivot-infrastructure`
- **Last commit on branch:** `43321bc` (test: update scaffold tests for .agents/skills/ folder format and add multi-agent test suites)
- **Total commits ahead of master:** 14 (all Plan 1 tasks)
- **master:** last commit `bc9a2ea` (docs(plan): Plan 1 — multi-agent infrastructure pivot)
- **Package version:** `1.0.0-0` (pre-release, not yet published)
- **Old package version on npm:** `@josenaldo/create-claude-workflow@0.1.0` (still live, NOT yet deprecated)
- **New package on npm:** `@josenaldo/create-agents-workflow` — NOT yet published
- **Tests:** 98 passing, 17 suites (baseline was 76 tests)

## Key paths — current and target

| Item                      | Current (old)                                                                          | Target (new)                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Local directory           | `/home/josenaldo/repos/personal/claude-workflow-template`                              | `/home/josenaldo/repos/personal/agents-workflow-template`                             |
| GitHub repo               | `https://github.com/josenaldo/claude-workflow-template`                                | `https://github.com/josenaldo/agents-workflow-template`                               |
| Git remote URL            | `git@github.com:josenaldo/claude-workflow-template.git`                                | `git@github.com:josenaldo/agents-workflow-template.git`                               |
| npm package               | `@josenaldo/create-claude-workflow` (deprecate)                                        | `@josenaldo/create-agents-workflow` (new)                                             |
| CLI binary name           | `create-claude-workflow`                                                               | `create-agents-workflow`                                                              |
| Claude Code memory dir    | `~/.claude/projects/-home-josenaldo-repos-personal-claude-workflow-template`           | `~/.claude/projects/-home-josenaldo-repos-personal-agents-workflow-template`          |

## Why the pivot

The original `@josenaldo/create-claude-workflow` was tightly coupled to Claude Code (skills in `.claude/skills/`, everything in `CLAUDE.md`). In April 2026, context engineering with multiple agents (Claude, Codex, Gemini, Copilot, Cursor) became the norm. The blog post `context-engineering-guia-completo.md` (Josenaldo, March 2026) prescribed a three-layer architecture:

1. `AGENTS.md` as universal source of truth (≤60 lines)
2. Per-agent thin references (CLAUDE.md, GEMINI.md, `.github/copilot-instructions.md`, `.cursorrules`) — no rule duplication
3. `.agents/skills/{name}/SKILL.md` canonical, with symlinks from `.claude/skills/` and `.github/skills/`

## Pending work (outstanding)

### Plan 2 (not yet written)

**What:** Rewrite 21 skills from their current minimal content to the full English body format (`Instructions`, `Critical`, `Examples`, `Troubleshooting`, `Performance Notes`, `See also`). Spec § 4 governs the template.

**How:** Invoke `superpowers:writing-plans` when ready. The skill file will land at `docs/superpowers/plans/2026-XX-XX-multi-agent-pivot-plan-2-skill-content.md`.

### Plan 3 (this directory) — Rename Cutover

**What:** Everything in [2026-04-18-rename-cutover-plan.md](../plans/2026-04-18-rename-cutover-plan.md).

**Dependencies:** Plan 2 must be complete first (no value in publishing 1.0.0 with stub skill bodies).

## Residual old-name references inside the repo (will be fixed by Plan 3, Phase 1)

| File                 | Line/Section                   | Old string                             | Action                                                             |
| -------------------- | ------------------------------ | -------------------------------------- | ------------------------------------------------------------------ |
| `bin/create.js`      | line 127                       | `create-claude-workflow`               | Rename in `bail()` message                                         |
| `README.md`          | entire file                    | `create-claude-workflow`               | Full rewrite for multi-agent                                       |
| `package-lock.json`  | lines 2, 8, 16                 | `@josenaldo/create-claude-workflow`    | Regenerate with `rm package-lock.json && npm install`              |
| Specs + plans docs   | multiple                       | references to the old package          | **Keep as-is** — historical context; deprecation references needed |

## Critical reminders for the rename

### Before renaming the directory

1. **Finish Plan 2 (skill rewrites) first.** Publishing 1.0.0 without the full skill bodies is a waste — they're a user-visible improvement.
2. **Close any open Claude Code sessions** that have this directory as the workspace. The session memory is tied to the current path.
3. **Verify working tree is clean** (`git status`) — any in-progress work gets caught in the rename.

### When renaming the directory

Two things must happen as an atomic pair:

```bash
# 1. Rename the directory
mv /home/josenaldo/repos/personal/claude-workflow-template \
   /home/josenaldo/repos/personal/agents-workflow-template

# 2. Move Claude Code's memory directory (slug derived from path)
mv "$HOME/.claude/projects/-home-josenaldo-repos-personal-claude-workflow-template" \
   "$HOME/.claude/projects/-home-josenaldo-repos-personal-agents-workflow-template"
```

Doing only step 1 loses the session history for this project in Claude Code. Doing only step 2 orphans the memory.

### Git remote

After the GitHub repo is renamed:

```bash
git remote set-url origin git@github.com:josenaldo/agents-workflow-template.git
```

GitHub auto-redirects old clone/push URLs with a warning, but updating the remote is cleaner.

### Order of operations (high level)

1. Merge Plan 1 branch → `master` (if not yet merged)
2. Write and execute Plan 2 (skill rewrites) → merge to `master`
3. Fix in-repo residual references (Phase 1 of rename plan)
4. Bump to `1.0.0` (drop the `-0`)
5. Rename GitHub repo via web UI
6. Update local git remote
7. Rename local directory
8. Move Claude Code memory directory
9. `npm publish` the new package
10. `npm deprecate` the old package after publishing `0.1.1` with banner
11. Update external references (blog, social, other projects)

## Spec and plan references

- **Design spec:** [docs/superpowers/specs/2026-04-17-multi-agent-pivot-design.md](../specs/2026-04-17-multi-agent-pivot-design.md)
- **Plan 1 (infrastructure):** [docs/superpowers/plans/2026-04-17-multi-agent-pivot-plan-1-infrastructure.md](../plans/2026-04-17-multi-agent-pivot-plan-1-infrastructure.md)
- **Rename cutover plan:** [docs/superpowers/plans/2026-04-18-rename-cutover-plan.md](../plans/2026-04-18-rename-cutover-plan.md)
- **Plan 2 (skill content):** NOT YET WRITTEN
- **Source article:** `/home/josenaldo/repos/personal/josenaldo.github.io/content/blog/context-engineering-guia-completo.md`

## Dogfooding note

This repo (the scaffolding tool itself) has not yet adopted the three-layer architecture for its OWN development context. The `core/` directory contains the TEMPLATES rendered into scaffolded projects, not active context for this repo. If desired, a follow-up could create a top-level `AGENTS.md` + `CLAUDE.md` for this repo — but that's out of scope for the current pivot.

## Where to pick up next

If starting a fresh session after a context reset, read this file first, then:

1. Check `git branch --show-current` to see where you are
2. Check `git log --oneline -20` on `master` to see what's been merged
3. Read the pending plans (`docs/superpowers/plans/`)
4. Resume from the earliest unstarted task in the current plan

If the directory has already been renamed but this file still exists: the rename worked. Confirm with `git remote -v` and `npm view @josenaldo/create-agents-workflow version`.

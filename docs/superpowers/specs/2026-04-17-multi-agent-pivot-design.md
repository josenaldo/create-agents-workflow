# Multi-Agent Pivot — Design Spec

- **Date:** 2026-04-17
- **Author:** Josenaldo Matos
- **Status:** approved (design)
- **Source of truth for architecture decisions:** [Context Engineering: guia completo](../../../../josenaldo.github.io/content/blog/context-engineering-guia-completo.md)

## 1. Motivation

The current package `@josenaldo/create-claude-workflow` (v0.1.0) is tightly coupled to Claude Code: skills live in `.claude/skills/`, CLAUDE.md holds everything, other agents (Codex, Gemini, Copilot, Cursor) are ignored. In 2026 this is an anti-pattern — most developers use multiple agents in the same project, and rules drift between them when each has a separate context file.

The referenced blog post prescribes a concrete multi-agent architecture built on three principles: **`.agents/skills/` as source of truth**, **`AGENTS.md` as universal constitution**, and **strict anti-duplication** (each rule has one home; others reference). This spec pivots the project to that architecture.

## 2. Scope

### In scope (this spec / MVP)

- Rename package + repo to `create-agents-workflow`
- `AGENTS.md` becomes the universal source of truth (≤60 lines): architecture, imperative rules, skill catalog, fallback
- Per-agent files become thin references (no duplicated rules):
  - `CLAUDE.md` (≤80 lines) — commands + Claude-specific disciplines
  - `GEMINI.md` — stub referencing AGENTS.md
  - `.github/copilot-instructions.md` — stub referencing AGENTS.md
  - `.cursorrules` — stub referencing AGENTS.md
- Skills migrate from flat `.md` files to folder format: `.agents/skills/{name}/SKILL.md` with optional `references/`, `scripts/`, `assets/`
- Symlinks generated post-scaffold: `.claude/skills/` → `../.agents/skills/`, `.github/skills/` → `../.agents/skills/`
- All 21 existing skills rewritten in the blog's full format, **in English** (`Instructions`, `Critical`, `Examples`, `Troubleshooting`, `Performance Notes`, `See also`)
- CLI keeps existing flags (`--yes`, `--stack`, `--overlay`, `--dry-run`, `--help`); adds `--agents <list>` (optional; default = all agents)
- Deprecate `@josenaldo/create-claude-workflow` via `npm deprecate`; publish final patch `0.1.1` with README pointer to the new package
- Publish `@josenaldo/create-agents-workflow@1.0.0`

### Out of scope (deferred to next spec / Escopo C)

- Meta-skills (e.g., `implement-backend-feature`, `implement-feature-frontend`) that orchestrate micro-skills
- Constraint-skills with deterministic validation scripts (e.g., `enforce-boundary` with `scripts/check-boundaries.sh`)
- Matrix of model selection by task type (Haiku/Sonnet/Opus) inside CLAUDE.md
- `.github/instructions/*.instructions.md` with `applyTo` globs (Copilot-specific scoped rules)
- Interactive `select` prompt for picking agents in the CLI (current plan uses flag + default-all)

The architecture MVP leaves hooks for all of the above (see Section 9).

## 3. Architecture of the Generated Project

Layout produced by `create-agents-workflow` for a project using `ts-node-npm + react-mantine`:

```text
my-project/
├── AGENTS.md                         # Layer 1: universal source of truth (≤60 lines)
├── CLAUDE.md                         # Layer 2: Claude-specific refs + commands (≤80 lines)
├── GEMINI.md                         # Layer 2: stub
├── .github/
│   ├── copilot-instructions.md       # Layer 2: stub
│   └── skills/ → ../.agents/skills/  # symlink (copy + warn on Windows)
├── .claude/
│   ├── skills/ → ../.agents/skills/  # symlink (copy + warn on Windows)
│   └── stack.resolved.json
├── .cursorrules                      # Layer 2: stub
├── .agents/
│   └── skills/                       # Layer 3: SOURCE OF TRUTH
│       ├── _core/
│       │   ├── write-adr/SKILL.md
│       │   ├── write-spec/SKILL.md
│       │   ├── write-readme/SKILL.md
│       │   └── enforce-boundary/SKILL.md     # constraint-skill (script hook reserved for next spec)
│       ├── ts-node-npm/
│       │   ├── create-usecase/SKILL.md
│       │   ├── add-endpoint-express/SKILL.md
│       │   └── write-unit-test-jest/SKILL.md
│       └── react-mantine/
│           ├── create-component-mantine/SKILL.md
│           ├── create-page-mantine/SKILL.md
│           └── frontend-hooks-react-query/SKILL.md
├── docs/
│   └── specs/
│       ├── WORKFLOW.md
│       ├── adr/_TEMPLATE.md
│       └── _TEMPLATE_module/...
├── memory/MEMORY.md
└── README.md                         # one-screen human guide to Layer 1/2/3
```

### 3.1 Layer 1 — `AGENTS.md` (universal, ≤60 lines)

Template sections (all concise imperatives):

1. Project identity (1-2 lines): name, stack
2. Architecture (3-5 lines): where new code goes, legacy, shared
3. Critical rules (5-10 imperative `NEVER`/`ALWAYS` lines, no justification)
4. Skill catalog: list of available skills with 1-line description each
5. Memory pointer: `See memory/MEMORY.md`
6. Fallback instructions: what to do when a referenced file is missing

### 3.2 Layer 2 — Per-agent files

Each references AGENTS.md rather than duplicating it.

**`CLAUDE.md` (≤80 lines):** one-line identity + `See AGENTS.md for architecture, rules, and skills` + `## Commands` block (rendered from stack's `cmdBlock`) + `## Memory` pointer. Includes a `## Context Engineering (Main Agent Discipline)` block with orchestrator-vs-executor rules (always present; documented as Claude-specific discipline since other agents don't yet have this pattern).

**`GEMINI.md`:** ~10 lines. Identity + `See AGENTS.md`.

**`.github/copilot-instructions.md`:** ~10 lines. Identity + `See AGENTS.md`.

**`.cursorrules`:** ~10 lines. Identity + `See AGENTS.md`.

### 3.3 Layer 3 — Skills as folders

Each skill is a directory, never a flat file:

```text
.agents/skills/create-usecase/
├── SKILL.md              # required; the skill body
├── references/           # optional; long examples, templates (progressive disclosure)
├── scripts/              # optional; executable scripts (reserved for constraint-skills in next spec)
└── assets/               # optional; images, fixtures, templates
```

## 4. Skill Format (Canonical Template)

### 4.1 Frontmatter

```yaml
---
name: create-usecase                 # required, kebab-case, matches folder name
description: "…"                     # required, ≤ 1024 chars, imperative + when-to-use + exclusions
metadata:
  skill_type: micro                  # micro | meta | constraint
  stack: ts-node-npm                 # optional; omit for _core skills
---
```

**Allowed frontmatter fields** (per the blog's Anthropic-guide summary): `name`, `description`, `license`, `compatibility`, `allowed-tools`, `metadata`. No XML tags. No `claude-`/`anthropic-` prefixes.

### 4.2 Body sections (in order)

**Language policy:** All skill content (headers, body, descriptions, examples, error messages) MUST be written in English. The blog post referenced for the architecture uses Portuguese for illustration, but skills in this project target a global audience and the section headings are standardized in English.

1. `# Title` — H1 with human-readable skill name
2. `## Instructions` — numbered steps, each with `- [ ]` checkboxes for concrete actions
3. `## Critical` — high-impact rules with brief consequence (not CAPS; one sentence of why)
4. `## Examples` — at least one concrete scenario in the format `User says:` / `Actions:` / `Result:`. Code examples > 20 lines go to `references/`
5. `## Troubleshooting` — 2-3 common errors as `**Error** → Cause → Solution`
6. `## Performance Notes` — optional; only when the agent tends to skip steps
7. `## See also` — cross-references to related skills (max 1 level deep, no A→B→C→D chains)

### 4.3 Size budget

- SKILL.md: ideally < 500 lines; definitely < 5000 words
- Code examples > 20 lines: move to `references/{name}.{ext}`

### 4.4 Description engineering (critical for triggering)

The `description` is the only field the agent reads before deciding whether to load the skill. Pattern:

> **WHAT it does** + **WHEN to use** (natural phrases the user would say) + **key capabilities** + **Don't use for X** (when overtriggering is a risk).

Lean toward "pushy" language. Example:

> ❌ Weak: `"Creating a use case."`
>
> ✅ Strong: `"Creating a Use Case with TDD in TypeScript + Node. Use when the user asks to create a use case, new service, new business operation, or says 'add X', 'create use case for Y'. Don't use for HTTP endpoints — use add-endpoint-express. Don't use for visual components — use create-component-mantine."`

### 4.5 Skill types used in this MVP

- **micro** — atomic operations (all stack skills + `write-adr`/`write-spec`/`write-readme`)
- **constraint** — `enforce-boundary` (verification checklist + rules; script reserved for next spec)
- **meta** — none in this MVP (reserved for next spec)

## 5. CLI Changes

### 5.1 New package

- Package name: `@josenaldo/create-agents-workflow`
- Binary: `create-agents-workflow`
- First published version: `1.0.0`

### 5.2 New flag: `--agents <list>`

```text
--agents <list>   Comma-separated: claude, codex, gemini, copilot, cursor
                  Default: all agents (all Layer 2 files generated)
```

- `.agents/skills/` and `AGENTS.md` are always generated (source of truth; also read natively by Codex, Gemini, Cursor)
- Filtered agents skip their Layer 2 stub and skip their symlink

Example:

```bash
create-agents-workflow my-app --stack ts-node-npm --agents claude,codex
# Generates: AGENTS.md, CLAUDE.md, .claude/skills/ (symlink), .agents/skills/
# Skips: GEMINI.md, .github/copilot-instructions.md, .github/skills/, .cursorrules
```

### 5.3 Symlink creation (post-scaffold step)

- Relative symlink: `ln -s ../.agents/skills .claude/skills` (via `fs.symlink`)
- Target: directory symlink (not individual file links)
- Created for each enabled agent that uses a native skills directory (`claude`, `copilot`)
- `codex`, `gemini`, `cursor` read `.agents/skills/` natively → no symlink needed

### 5.4 Windows fallback

- Attempt `fs.symlink` first
- On `EPERM`/`ENOSYS`: fall back to `cp -r` of `.agents/skills/` into `.claude/skills/` and `.github/skills/`
- Emit stderr warning: `"Symlinks unavailable on this platform. Skills duplicated — edit only .agents/skills/ and re-run to sync."`
- Append a note to the generated `AGENTS.md` under a `## Platform Notes` section explaining the duplication

### 5.5 Interactive mode

- No new prompts added in this MVP (default-all is simple and safe)
- Existing prompts unchanged: project name, base stack, overlay, git init, seed memory
- Agent selection is flag-only (power-user feature)

## 6. Internal Structure of `create-agents-workflow` Repo

```text
create-agents-workflow/
├── bin/create.js
├── lib/
│   ├── copy.js           # copyTree (recursive), appendFile, NEW: createSymlinks
│   ├── stack.js          # unchanged
│   └── renderer.js       # unchanged
├── core/
│   ├── AGENTS.md.tmpl            # NEW role: universal source of truth
│   ├── CLAUDE.md.tmpl            # rewritten: thin, refs AGENTS.md
│   ├── GEMINI.md.tmpl            # NEW
│   ├── .github/copilot-instructions.md.tmpl  # NEW
│   ├── .cursorrules.tmpl                     # NEW
│   ├── README.md.tmpl            # NEW: one-screen human guide to Layer 1/2/3
│   ├── .agents/skills/_core/                 # NEW LOCATION
│   │   ├── write-adr/SKILL.md
│   │   ├── write-spec/SKILL.md
│   │   ├── write-readme/SKILL.md
│   │   └── enforce-boundary/SKILL.md
│   ├── docs/specs/...     # unchanged
│   └── memory/MEMORY.md.tmpl  # unchanged
├── stacks/
│   ├── ts-node-npm/
│   │   ├── stack.json
│   │   ├── gitignore.append
│   │   └── skills/                           # REWRITTEN
│   │       ├── create-usecase/SKILL.md
│   │       ├── add-endpoint-express/SKILL.md
│   │       └── write-unit-test-jest/SKILL.md
│   └── ...                 # same pattern for all stacks + overlays
├── test/scaffold.test.js   # updated; new assertions for symlinks, layers, agents flag
└── package.json            # bumped to 1.0.0, renamed, repository updated
```

### 6.1 Rendering behavior for skills

- The CLI copies `stacks/{stack}/skills/` → `{target}/.agents/skills/{stack}/` recursively (preserves folder structure)
- The same for `core/.agents/skills/_core/` → `{target}/.agents/skills/_core/`
- Overlay skills: `stacks/react-mantine/skills/` → `{target}/.agents/skills/react-mantine/`
- `{{placeholders}}` inside `SKILL.md` are rendered at copy time (same as today)

## 7. Rename and Deprecation

### 7.1 Repo rename

- `github.com/josenaldo/claude-workflow-template` → `github.com/josenaldo/agents-workflow-template`
- GitHub auto-redirects old URLs; issues, PRs, stars preserved
- `package.json.repository.url` and `homepage` updated to the new URL
- Local directory `/home/josenaldo/repos/personal/claude-workflow-template` renamed to `agents-workflow-template` as the final step

### 7.2 npm deprecation of the old package

1. Final patch commit on `@josenaldo/create-claude-workflow`:
   - `README.md`: add banner at top — "⚠️ DEPRECATED. Use `@josenaldo/create-agents-workflow` for multi-agent support."
2. Publish `0.1.1` with that README
3. Run `npm deprecate '@josenaldo/create-claude-workflow@*' 'Use @josenaldo/create-agents-workflow — multi-agent support (Claude, Codex, Gemini, Copilot, Cursor)'`
4. Users installing the old package see the warning in `npm install` output

### 7.3 No unpublish

Per npm policy and project integrity: the old package stays published (deprecated but functional). Users with lockfiles pinned to `0.1.0` keep working.

## 8. Tests

Existing 76 tests in `test/scaffold.test.js` need updates. Expected shape after this spec:

### 8.1 Updated assertions

- Skill paths: `.claude/skills/{stack}/{skill}.md` → `.agents/skills/{stack}/{skill}/SKILL.md` for stack skills
- Core skills: `.claude/skills/_core/*.md` → `.agents/skills/_core/{skill}/SKILL.md`
- Symlink assertions: `.claude/skills/` is a symlink resolving to `.agents/skills/` (on Linux/macOS)
- AGENTS.md: assert catalog section contains all rendered skill names
- CLAUDE.md: assert it references AGENTS.md; assert it does NOT contain duplicated critical rules

### 8.2 New test suites

- `scaffold: multi-agent outputs` — for a given stack, assert all 4 per-agent Layer 2 files exist and each references AGENTS.md (not duplicates rules)
- `scaffold: --agents filter` — `--agents claude` generates only CLAUDE.md + AGENTS.md + .claude/skills symlink; asserts GEMINI.md etc. are absent
- `scaffold: skills folder format` — asserts `SKILL.md` exists inside each skill directory; asserts `references/`/`scripts/`/`assets/` are supported when present in source
- `scaffold: skill frontmatter` — parses frontmatter of each generated SKILL.md; asserts `name`, `description`, `metadata.skill_type` present

### 8.3 Platform coverage

- CI matrix: Linux (symlink path). Windows CI deferred — document fallback behavior, rely on manual testing for MVP.

## 9. Hooks for the Next Spec (Escopo C)

The MVP is shaped so the next spec adds content, not rearchitecting:

| Next-spec feature                                | Hook ready in this MVP                                                                                                                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Meta-skills                                      | `metadata.skill_type: meta` already validated; AGENTS.md catalog section can list them with `[meta]` tag                                                                          |
| Constraint-skill scripts                         | `scripts/` folder already copied by the renderer; `enforce-boundary/SKILL.md` already positioned as a constraint-skill with a placeholder for `## Automated Validation` section   |
| Skill graph references                           | `## See also` section already established; cross-refs use relative paths (`../other-skill/SKILL.md`)                                                                              |
| Model selection matrix                           | `CLAUDE.md` reserves a comment `<!-- Model selection matrix — added in next iteration -->` pointing to where it'll land                                                           |
| Copilot `.github/instructions/*.instructions.md` | `.github/` directory already exists in the generated project; adding instructions is additive                                                                                     |

## 10. Implementation Order (high-level; detailed plan from writing-plans)

1. **Repo rename** + `package.json` updates (name, bin, repo URL, bumped to 1.0.0-0 pre-release while in progress)
2. **Core templates** — rewrite AGENTS.md.tmpl, CLAUDE.md.tmpl; create GEMINI.md.tmpl, copilot-instructions.md.tmpl, .cursorrules.tmpl
3. **Core skills migration** — convert 4 core skills to `core/.agents/skills/_core/{name}/SKILL.md` with full format
4. **Stack skills migration** — convert 12 stack skills (ts/spring/python/go) + 5 overlay skills (mantine/mui) to the folder format with full body sections
5. **Renderer updates** — ensure recursive skill folder copy; add `createSymlinks(targetDir, agents)` function
6. **CLI changes** — add `--agents <list>` parsing; wire filtering logic; symlink creation post-scaffold with Windows fallback
7. **Test updates** — migrate existing tests; add new suites (multi-agent, --agents filter, folder format, frontmatter validation)
8. **Manual verification** — `npx .` dry-run for all 6 bases × 2 overlay states; symlink verification; opening the generated project in each agent mentally (Claude/Codex/Gemini/Copilot/Cursor)
9. **Publish** — `@josenaldo/create-agents-workflow@1.0.0` with `publishConfig.access: public`
10. **Deprecate old package** — patch `0.1.1` + README banner + `npm deprecate`

## 11. Risks and Mitigations

| Risk                                                  | Mitigation                                                                                                              |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Symlinks fail silently on Windows                     | Explicit fallback + stderr warning + `AGENTS.md` Platform Notes section                                                 |
| Rewriting 21 skills is substantial work               | If the writing-plans plan gets too large, split into two sub-plans (infra/rename first, then skill rewrites in batches) |
| `@josenaldo/create-agents-workflow` name may be taken | Verify availability before starting implementation; fall back to a near-synonym if taken                                |
| Existing users with lockfiles broken                  | No-op: old package stays published and functional; new package is net-additive                                          |
| AGENTS.md size drift (>60 lines)                      | Add a test assertion that the rendered AGENTS.md is under 80 lines (buffer above target)                                |
| CLAUDE.md size drift (>80 lines)                      | Same: test assertion < 100 lines                                                                                        |
| Skill SKILL.md exceeds 500 lines                      | Lint step in tests that warns for any SKILL.md > 500 lines                                                              |

## 12. Resolved Decisions (previously open)

- **AGENTS.md footer link:** include a single-line footer `Generated by create-agents-workflow — see blog post for architecture rationale` with link to the repo. Purely informational; not part of the 60-line budget.
- **Scaffold `README.md.tmpl`:** YES, emit a one-screen `README.md` at the generated project root that explains the Layer 1/2/3 structure (who reads what) so a human onboarding to the project understands where to edit. Counts as human-facing doc, not agent context.
- **`memory/MEMORY.md`:** unchanged in this MVP. Its template stays the same; its cross-references stay pointing from CLAUDE.md and AGENTS.md. Revisit in escopo C.

---

*This design document is the output of brainstorming. Next step: implementation plan via `writing-plans`.*

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

| Flag               | Short | Description                                                          |
| ------------------ | ----- | -------------------------------------------------------------------- |
| `--yes`            | `-y`  | Accept all defaults (non-interactive)                                |
| `--stack <name>`   |       | Base stack (skip prompt)                                             |
| `--overlay <name>` |       | Frontend overlay or `none` (skip prompt)                             |
| `--agents <list>`  |       | Comma-separated: `claude,codex,gemini,copilot,cursor` (default: all) |
| `--dry-run`        |       | Show what would be generated without writing                         |
| `--help`           | `-h`  | Show help                                                            |

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

# create-claude-workflow

Scaffolds a **Claude Code workflow** (CLAUDE.md + docs/specs + skills + memory + command mapping) into any project, tailored to the chosen stack.

> Status: early MVP. Only `ts-node-npm` ships with full skills/templates; other stacks ship with `stack.json` (command mapping + layout) and get the agnostic core. More stacks will be fleshed out incrementally.

## Usage

```bash
# Interactive (prompts for everything)
npx @josenaldo/create-claude-workflow

# Current directory
npx @josenaldo/create-claude-workflow .

# Non-interactive (scriptable)
npx @josenaldo/create-claude-workflow my-app --stack ts-node-npm --yes

# Preview without writing
npx @josenaldo/create-claude-workflow my-app --stack go --dry-run
```

### Options

| Flag               | Short | Description                                  |
| ------------------ | ----- | -------------------------------------------- |
| `--yes`            | `-y`  | Accept all defaults (non-interactive)        |
| `--stack <name>`   |       | Base stack (skip prompt)                     |
| `--overlay <name>` |       | Frontend overlay or `none` (skip prompt)     |
| `--dry-run`        |       | Show what would be generated without writing |
| `--help`           | `-h`  | Show help                                    |

### Interactive mode

Without flags, the CLI asks:

- **Project name** (or `.` for current directory)
- **Base stack** (one of: `ts-node-npm`, `js-node-npm`, `java-gradle`, `java-spring-gradle`, `python-uv`, `go`)
- **Frontend overlay** (optional: `react-mantine`, `react-mui`, or none)
- **Init git / initial commit**
- **Seed memory/** directory

Then it:

1. Copies the agnostic `core/` (workflow docs, skill templates, CLAUDE.md template, memory scaffolding).
2. Applies the selected stack overlay(s) — merges `stack.json`, copies stack-specific skills and code templates.
3. Renders `CLAUDE.md` by substituting `{{cmd.*}}`, `{{layout}}`, and project metadata placeholders.

## Design

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the composition model (core + base stack + overlay).

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

"Manifest" = `stack.json` defines commands and layout, but no code templates or stack-specific skills yet. "Skills" = manifest + stack-specific skills (create-usecase, add-endpoint, write-unit-test). The agnostic core always applies.

## Adding a new stack

1. Create `stacks/<name>/stack.json` with `commands`, `layout`, `testFramework`.
2. (Optional) add `stacks/<name>/skills/` for stack-specific skills.
3. (Optional) add `stacks/<name>/templates/` for code scaffolding rendered into the new project.
4. (Optional) add `stacks/<name>/gitignore.append` for lines to append to `.gitignore`.

If `kind: "overlay"` in `stack.json`, the CLI will require a compatible base (declared via `requires`).

## License

MIT

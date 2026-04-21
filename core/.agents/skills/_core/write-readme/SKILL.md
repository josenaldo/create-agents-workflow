---
name: write-readme
description: "Create or update a README.md for a module, feature, or the project root. Use when the user says 'write a README', 'update the docs', 'document this module', 'add a getting started guide'. Don't use for architecture decisions — use write-adr. Don't use for user stories — use write-spec."
metadata:
  skill_type: micro
---

# Write README

## Instructions

1. - [ ] Determine the scope: project root (`README.md`) or specific module (`src/{module}/README.md`).
2. - [ ] Read `AGENTS.md` to extract the project's semantic commands (dev, test, build, lint).
3. - [ ] Write the README with these sections:
   - **One-paragraph description** — what this project/module does, in plain language.
   - **How to run** — dev, test, build commands. Use the semantic commands from `AGENTS.md`, not raw tool commands.
   - **Architecture overview** — brief summary with links to `docs/specs/` for details.
   - **Key decisions** — link to relevant ADRs in `docs/specs/adr/`.
4. - [ ] Keep it concise — link to detailed docs instead of duplicating content.
5. - [ ] If updating an existing README, preserve any custom sections the user has added.
6. - [ ] Verify all links resolve to existing files.

## Critical

- README must be self-sufficient for a new developer — they should be able to clone, install, and run within 5 minutes following only the README.
- Use semantic commands from `AGENTS.md` (e.g., `npm run dev`) not tool-specific commands (e.g., `npx ts-node src/index.ts`) — semantic commands survive tooling changes.
- Never duplicate content that lives in `docs/specs/` — link to it instead. Duplicated content drifts and confuses.
- Keep the README under 200 lines — longer READMEs don't get read.

## Examples

**User says:** "Write a README for the billing module."

**Actions:**
1. Scope: module → `src/billing/README.md`.
2. Read `AGENTS.md` → commands are `npm run dev`, `npm test`, `npm run build`.
3. Write:
   - Description: "Billing module handles invoice generation, payment processing, and subscription management."
   - How to run: `npm run dev`, `npm test -- --filter billing`.
   - Architecture: link to `docs/specs/billing/domain-model.md`.
   - Key decisions: link to `docs/specs/adr/ADR-003-stripe-integration.md`.
4. Total: ~60 lines.

**Result:** `src/billing/README.md` created with 4 sections, all links verified.

## Troubleshooting

**Stale commands** → README shows commands that don't work → Re-read `AGENTS.md` and `package.json` (or equivalent) to verify current commands before writing.

**Missing architecture docs** → No `docs/specs/` content to link to → Write the README with a placeholder link and note: "Architecture docs pending — see write-spec skill."

**README too long** → Exceeded 200 lines → Extract detailed sections into `docs/` files and replace with links. The README is an index, not an encyclopedia.

## See also

- `write-adr` — for recording architectural decisions
- `write-spec` — for user stories with acceptance criteria

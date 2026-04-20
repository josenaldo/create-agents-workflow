---
name: write-adr
description: "Write an Architecture Decision Record (ADR) capturing a significant technical decision. Use when the user says 'document this decision', 'write an ADR', 'record why we chose X', 'add a technical decision'. Don't use for user stories — use write-spec. Don't use for general documentation — use write-readme."
metadata:
  skill_type: micro
---

# Write ADR

## Instructions

1. - [ ] Check `docs/specs/adr/` for the next available ADR number (e.g., `ADR-003`).
2. - [ ] Copy `docs/specs/adr/_TEMPLATE.md` → `docs/specs/adr/ADR-NNN-{slug}.md` where `{slug}` is a lowercase-kebab summary of the decision.
3. - [ ] Fill in the **Context** section: what prompted this decision, constraints, relevant facts.
4. - [ ] Fill in the **Decision** section: what was decided and why, including alternatives considered.
5. - [ ] Fill in the **Consequences** section with three subsections:
   - Positive outcomes
   - Negative outcomes / trade-offs
   - Risks and mitigations
6. - [ ] Set status to `proposed` (default) or `accepted` (if already approved by the team).
7. - [ ] Add references: link to related issues, PRs, other ADRs, or external resources.
8. - [ ] Update the ADR index if one exists, or add a reference in the module's README.

## Critical

- One decision per ADR — combining multiple decisions makes them impossible to reference individually.
- Never delete or overwrite an existing ADR — supersede it with a new ADR that references the old one (status → `superseded`).
- Context section must be self-contained — a reader 6 months from now should understand the decision without external context.
- Always list at least one alternative considered — a decision without alternatives is not a decision, it's an assumption.

## Examples

**User says:** "We decided to use PostgreSQL instead of MongoDB for the orders service. Document this."

**Actions:**
1. Check `docs/specs/adr/` — next number is `004`.
2. Create `docs/specs/adr/ADR-004-use-postgresql-for-orders.md` from template.
3. Context: Orders require complex joins, transactional consistency, and relational queries.
4. Decision: PostgreSQL chosen for ACID compliance and mature JOIN support.
5. Alternatives: MongoDB (rejected — poor multi-document transactions), DynamoDB (rejected — vendor lock-in).
6. Consequences: positive (strong consistency), negative (schema migrations needed), risk (connection pooling at scale).
7. Status: `proposed`.

**Result:** `docs/specs/adr/ADR-004-use-postgresql-for-orders.md` created with all sections filled.

## Troubleshooting

**ADR number conflict** → Two ADRs share the same number → Check existing files in `docs/specs/adr/`, pick the next unused number. Renumber the newer ADR if already committed.

**Template not found** → `_TEMPLATE.md` is missing → Recreate it from `docs/specs/adr/_TEMPLATE.md` in the scaffold, or create a minimal ADR with sections: Context, Decision, Consequences, Status.

**Status confusion** → Unclear when to use `proposed` vs `accepted` → Use `proposed` for decisions awaiting team review; `accepted` after approval; `superseded` when replaced by a newer ADR.

## See also

- `write-spec` — for user stories with acceptance criteria
- `write-readme` — for module or project documentation

---
name: write-spec
description: "Create or update a user story with acceptance criteria following the As-a/I-want/So-that format. Use when the user says 'write a user story', 'create a spec', 'define requirements for X', 'add acceptance criteria'. Don't use for architecture decisions — use write-adr. Don't use for README files — use write-readme."
metadata:
  skill_type: micro
---

# Write Spec (User Story)

## Instructions

1. - [ ] Identify the target module. Create `docs/specs/{module}/user-stories/` if it doesn't exist.
2. - [ ] Determine the next user story number by checking existing files in the directory.
3. - [ ] Create `US-NNN-{slug}.md` using this format:

```markdown
# US-NNN: {Title}

**As a** {role}, **I want** {action}, **so that** {benefit}.

## Acceptance Criteria

- [ ] {Criterion 1 — observable, testable behavior}
- [ ] {Criterion 2}
- [ ] {Criterion 3}

## Definition of Done

- [ ] Tests pass (unit + integration)
- [ ] Module docs updated
- [ ] PR reviewed
```

4. - [ ] Write acceptance criteria as observable, testable behaviors — not implementation details.
5. - [ ] Link to related ADRs, endpoints, or domain models if applicable.
6. - [ ] Update the module's `docs/specs/{module}/` index if one exists.

## Critical

- Each user story must have at least two acceptance criteria — a story with zero criteria is untestable and will cause scope creep.
- Acceptance criteria describe WHAT, not HOW — "User sees a confirmation message" not "Show a toast using Mantine notifications".
- Number stories sequentially within the module — gaps are acceptable (deleted stories), duplicates are not.
- Never combine unrelated features in one story — if it has "and" in the title, it should probably be two stories.

## Examples

**User says:** "Create a user story for the login feature — users should be able to log in with email and password."

**Actions:**
1. Module: `auth`. Path: `docs/specs/auth/user-stories/`.
2. Next number: `US-002`.
3. Create `US-002-login-with-email.md`:
   - As a registered user, I want to log in with my email and password, so that I can access my account.
   - Acceptance criteria: valid credentials → redirect to dashboard; invalid → error message; account locked after 5 failures.
4. Link to `docs/specs/auth/endpoints.md` for the `POST /api/auth/login` endpoint.

**Result:** `docs/specs/auth/user-stories/US-002-login-with-email.md` created with 3 acceptance criteria and a link to the endpoint spec.

## Troubleshooting

**Unclear module mapping** → Don't know which module a story belongs to → Check the project's domain model or feature structure in `docs/specs/`. If no module exists yet, create the directory structure using the `_TEMPLATE_module` as a guide.

**Too many acceptance criteria** → Story has 10+ criteria → The story is too large. Split it into smaller stories that each deliver testable value independently.

**Overlapping stories** → New story duplicates an existing one → Search existing user stories in the module first. Extend the existing story or reference it instead of creating a duplicate.

## See also

- `write-adr` — for recording architectural decisions
- `write-readme` — for module or project documentation
- `enforce-boundary` — for verifying implementation follows architecture rules

---
name: write-spec
description: Create or update a user story with acceptance criteria in docs/specs/{module}/user-stories/.
metadata:
  skill_type: micro
---

# Write Spec (User Story)

1. Identify the module. Create `docs/specs/{module}/user-stories/` if it doesn't exist.
2. Use the format:
   ```
   # US-NNN: {Title}
   **As a** {role}, **I want** {action}, **so that** {benefit}.
   ## Acceptance Criteria
   - [ ] ...
   ## Definition of Done
   - [ ] Tests pass (unit + integration)
   - [ ] Module docs updated
   - [ ] PR reviewed
   ```
3. Number sequentially within the module.
4. Link to related ADRs or endpoints if applicable.

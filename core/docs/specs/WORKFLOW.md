# Development Workflow

## Phases

### 1. Brainstorming
Explore the problem space. Understand user intent, constraints, and prior decisions.

### 2. Design
Define the approach: entities, use cases, endpoints, and layer responsibilities.

### 3. Stories + ADRs
- Write user stories (`docs/specs/{module}/user-stories/`) with acceptance criteria.
- Record significant decisions in ADRs (`docs/specs/adr/`).

### 4. Planning
Break stories into tasks. Each task should be independently testable and committable.

### 5. Implementation (TDD)
For each task:
1. **RED:** Write a failing test.
2. **GREEN:** Implement the minimum code to pass.
3. **REFACTOR:** Clean up while tests stay green.
4. **COMMIT:** One commit per RED→GREEN→REFACTOR cycle.

### 6. Review
- Run `enforce-boundary` to verify Clean Architecture compliance.
- Verify all module docs are in sync.
- Run full test suite.

### 7. Deploy
- Create PR with summary and test plan.
- Merge after review.

## Module Docs Checklist

After any change, verify:
- [ ] `docs/specs/{module}/domain-model.md` reflects entity changes
- [ ] `docs/specs/{module}/endpoints.md` reflects route changes
- [ ] `docs/specs/{module}/route-mapping.md` reflects frontend integrations

---
name: enforce-boundary
description: "Verify Clean Architecture layer boundaries — domain and application must not import infrastructure. Use when the user says 'check boundaries', 'verify architecture', 'run boundary check', 'validate layers', or after any code change that touches domain or application layers. Don't use for writing new code — use the appropriate create-usecase or add-endpoint skill."
metadata:
  skill_type: constraint
---

# Enforce Boundary

Run as the final verification step on any code change that touches domain, application, or infrastructure layers.

## Instructions

1. - [ ] Identify all files changed in the current PR or working tree.
2. - [ ] For each changed file, determine its layer based on directory path:
   - `domain/` → Domain layer
   - `application/` → Application layer
   - `infrastructure/` → Infrastructure layer
3. - [ ] **Domain layer** (`domain/`): verify it does NOT import from `application/` or `infrastructure/`. Verify it does NOT import framework-specific modules (HTTP, ORM, DI containers, etc.).
4. - [ ] **Application layer** (`application/`): verify it does NOT import from `infrastructure/`. Confirm it only imports from `domain/` (entities, value objects, repository interfaces).
5. - [ ] **Infrastructure layer** (`infrastructure/`): confirm imports from `domain/` and `application/` are valid (implementing interfaces, wiring dependencies).
6. - [ ] Report all violations with: file path, line number, disallowed import, and which rule it violates.
7. - [ ] Flag violations but do NOT auto-fix — the developer decides how to resolve the dependency.

## Critical

- Domain layer is the innermost ring — it must have ZERO outward dependencies. A domain entity importing an HTTP client collapses the entire architecture.
- Application layer depends ONLY on domain — if it imports infrastructure, the use case becomes untestable without real databases/APIs.
- Flag, don't fix — auto-fixing import violations can break the code in subtle ways. Present the violation and let the developer choose the solution.
- Check transitive dependencies — `domain/Order.ts` importing `domain/utils.ts` which imports `infrastructure/db.ts` is still a violation.

## Examples

**User says:** "I just refactored the orders module. Check the boundaries."

**Actions:**
1. Identify changed files: `src/domain/Order.ts`, `src/application/CreateOrderUseCase.ts`, `src/infrastructure/OrderRepositoryImpl.ts`.
2. Check `Order.ts` imports: `import { Money } from '../domain/Money'` → valid (domain-to-domain).
3. Check `CreateOrderUseCase.ts` imports: `import { OrderRepository } from '../domain/OrderRepository'` → valid; `import { db } from '../infrastructure/db'` → **VIOLATION**.
4. Report: `src/application/CreateOrderUseCase.ts:3 — imports from infrastructure/db (application → infrastructure not allowed)`.

**Result:** One violation reported. Developer should inject the repository via constructor instead of importing the infrastructure directly.

## Troubleshooting

**False positive on shared types** → A type file in `infrastructure/` is imported by `application/` → Move shared types/interfaces to `domain/` where they belong. Types that cross layer boundaries should live in the innermost layer that defines them.

**Unclear layer for a file** → File is outside the standard directories → Files outside `domain/`, `application/`, `infrastructure/` are not subject to boundary rules. Utility files in `shared/` or `common/` should not contain business logic.

**Too many violations to fix at once** → Large codebase with many boundary violations → Prioritize domain layer violations first (most critical), then application layer. Fix incrementally across PRs rather than in one massive refactor.

## See also

- `create-usecase` / `create-usecase-go` / `create-usecase-spring` / `create-usecase-fastapi` — for creating use cases that respect layer boundaries
- `write-adr` — for documenting boundary decisions

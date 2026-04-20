---
name: create-usecase
description: "Scaffold a new Use Case class following Clean Architecture with TDD in a TypeScript + Node project. Use when the user says 'create use case', 'new service', 'new business operation', 'add X logic', 'implement Y feature'. Don't use for HTTP endpoints — use add-endpoint-express. Don't use for frontend components."
metadata:
  skill_type: micro
  stack: ts-node-npm
---

# Create Use Case

## Instructions

1. - [ ] Identify the module name (e.g., `users`) and use case name in PascalCase (e.g., `CreateUser`).
2. - [ ] Determine the target path: `src/{module}/application/use-cases/{UseCaseName}.ts`.
3. - [ ] Create or update the repository port interface in `src/{module}/application/ports/{entity}-repository.ts` if it doesn't exist:

```typescript
export interface {Entity}Repository {
  save(entity: {Entity}): Promise<void>;
  findById(id: string): Promise<{Entity} | null>;
}
```

4. - [ ] Create the use case file with Input/Output interfaces:

```typescript
import type { {Entity}Repository } from '../ports/{entity}-repository';

export interface {UseCaseName}Input {
  field1: string;
  field2: number;
}

export interface {UseCaseName}Output {
  id: string;
  field1: string;
  createdAt: string;
}

export class {UseCaseName} {
  constructor(private readonly repository: {Entity}Repository) {}

  async execute(input: {UseCaseName}Input): Promise<{UseCaseName}Output> {
    // 1. Validate input
    // 2. Execute business logic
    // 3. Persist via repository
    // 4. Return output
  }
}
```

5. - [ ] Create the unit test first (TDD): `src/{module}/application/use-cases/{UseCaseName}.test.ts`.
6. - [ ] Run the test — confirm RED (fails for the right reason).
7. - [ ] Implement the `execute` method to make the test pass.
8. - [ ] Run `enforce-boundary` to verify no layer violations.

## Critical

- Use cases MUST NOT import from `infrastructure/` — this breaks testability and couples business logic to Express/database/HTTP details.
- Input/Output types are plain objects with no framework dependencies — importing Express types into use cases leaks infrastructure concerns.
- One use case per file, one public class per file — multiple use cases in one file leads to hidden coupling and bloated modules.
- Constructor injection for all dependencies (port interfaces only) — direct instantiation of dependencies makes the use case untestable.

## Examples

**User says:** "Create a use case to cancel an order."

**Actions:**
1. Module: `orders`, use case: `CancelOrder`.
2. Path: `src/orders/application/use-cases/CancelOrder.ts`.
3. Port: `OrderRepository` with `findById` and `save`.
4. Input: `CancelOrderInput { orderId: string; reason: string }`.
5. Output: `CancelOrderOutput { orderId: string; cancelledAt: string }`.
6. Test first: verify order found, status changes, reason stored.
7. Implement: find order → validate cancellable → update status → save → return output.

**Result:** `CancelOrder.ts` and `CancelOrder.test.ts` created. Tests pass, no boundary violations.

## Troubleshooting

**Circular dependency** → TypeScript compile error on port imports → Use `import type { ... }` for port interfaces. Ensure ports don't import from use cases.

**Test can't instantiate use case** → Constructor requires dependencies → Create in-memory implementations of ports for testing. Inject them via the constructor.

**Use case imports from infrastructure** → `enforce-boundary` flags a violation → Move the import to use the port interface from `application/ports/` instead of the concrete implementation.

## See also

- `add-endpoint-express` — expose this use case via HTTP
- `write-unit-test-jest` — detailed unit test patterns for Jest
- `enforce-boundary` — verify Clean Architecture layer rules

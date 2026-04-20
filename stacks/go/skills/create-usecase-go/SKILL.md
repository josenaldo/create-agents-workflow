---
name: create-usecase-go
description: "Scaffold a new Use Case following Clean Architecture with TDD in a Go project. Use when the user says 'create use case', 'new service', 'new business operation', 'add X logic', 'implement Y feature'. Don't use for HTTP endpoints — use add-endpoint-gin. Don't use for frontend components — use create-component-mantine or create-component-mui."
metadata:
  skill_type: micro
  stack: go
---

# Create Use Case (Go)

## Instructions

1. - [ ] Identify the module name (e.g., `users`) and use case name in PascalCase (e.g., `CreateUser`).
2. - [ ] Determine the target path: `internal/{module}/application/usecases/{use_case_snake}.go`.
3. - [ ] Create or update the repository port interface in `internal/{module}/application/ports/` if it doesn't exist:

```go
package ports

import "context"

type {Entity}Repository interface {
    Save(ctx context.Context, entity *{Entity}) error
    FindByID(ctx context.Context, id string) (*{Entity}, error)
}
```

4. - [ ] Create the use case file:

```go
package usecases

import (
    "context"
    "{project}/internal/{module}/application/ports"
)

type {UseCaseName}Input struct {
    // fields with validation tags
}

type {UseCaseName}Output struct {
    // fields
}

type {UseCaseName} struct {
    repo ports.{Entity}Repository
}

func New{UseCaseName}(repo ports.{Entity}Repository) *{UseCaseName} {
    return &{UseCaseName}{repo: repo}
}

func (uc *{UseCaseName}) Execute(ctx context.Context, input {UseCaseName}Input) ({UseCaseName}Output, error) {
    // 1. Validate input
    // 2. Execute business logic
    // 3. Persist via repository
    // 4. Return output
}
```

5. - [ ] Create the unit test first (TDD): `internal/{module}/application/usecases/{use_case_snake}_test.go`.
6. - [ ] Run the test — confirm RED (fails for the right reason).
7. - [ ] Implement the `Execute` method to make the test pass.
8. - [ ] Run `enforce-boundary` to verify no layer violations.

## Critical

- Use cases MUST NOT import from `infrastructure/` — this breaks testability and couples business logic to frameworks.
- Always accept `context.Context` as the first parameter — without it, cancellation, timeouts, and tracing won't propagate.
- Constructor receives only port interfaces — concrete implementations are injected at the infrastructure layer, never inside the use case.
- Return `(Output, error)` — use explicit error returns, never panics. Panics crash the server; errors are handled gracefully.

## Examples

**User says:** "Create a use case to cancel an order."

**Actions:**
1. Module: `orders`, use case: `CancelOrder`.
2. Path: `internal/orders/application/usecases/cancel_order.go`.
3. Port: `OrderRepository` interface with `FindByID` and `Save` methods.
4. Input: `CancelOrderInput{OrderID string, Reason string}`.
5. Output: `CancelOrderOutput{CancelledAt time.Time}`.
6. Test first: verify order is found, status changes to cancelled, reason is stored.
7. Implement: find order → validate it's cancellable → update status → save.

**Result:** `cancel_order.go` and `cancel_order_test.go` created, test passes, no boundary violations.

## Troubleshooting

**Port interface not found** → Compilation fails on missing type → Create the port interface in `internal/{module}/application/ports/` before implementing the use case. Ports define the contract; implementation comes later.

**Circular import** → Package `usecases` imports `ports` which imports `usecases` → Ports must only define interfaces using domain types. Move shared types to the `domain/` package to break the cycle.

**Test can't instantiate use case** → Constructor signature changed → Update the test to match the current constructor. Use an in-memory fake repository from `tests/fakes/`, not a mock framework.

## See also

- `add-endpoint-gin` — expose this use case via HTTP
- `write-unit-test-go` — detailed unit test patterns for Go
- `enforce-boundary` — verify Clean Architecture layer rules

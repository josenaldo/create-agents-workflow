---
name: create-usecase-go
description: Scaffold a new Use Case following Clean Architecture in a Go project.
metadata:
  skill_type: micro
  stack: go
---

# Create Use Case (Go)

## Inputs

- **Module name** (e.g., `users`, `orders`)
- **Use case name** in PascalCase (e.g., `CreateUser`, `CancelOrder`)

## Steps

1. Determine the target path: `internal/{module}/application/usecases/{use_case_snake}.go`
2. Create the use case file:

```go
package usecases

import (
    "context"
    "internal/{module}/application/ports"
)

type {UseCaseName}Input struct {
    // fields
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
    // implementation
}
```

3. Create or update the repository port interface in `internal/{module}/application/ports/` if it doesn't exist:

```go
package ports

import "context"

type {Entity}Repository interface {
    Save(ctx context.Context, entity *{Entity}) error
    FindByID(ctx context.Context, id string) (*{Entity}, error)
}
```

4. Create the unit test: `internal/{module}/application/usecases/{use_case_snake}_test.go`
5. Follow TDD — write the test first, confirm RED, then implement.

## Rules

- Use cases MUST NOT import from `infrastructure/` package.
- Use plain structs for Input/Output — no framework dependencies.
- Always accept `context.Context` as the first parameter.
- Constructor function `New{UseCaseName}` receives only port interfaces.
- Return `(Output, error)` — use explicit error returns, not panics.

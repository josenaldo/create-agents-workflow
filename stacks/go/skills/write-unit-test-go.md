---
name: write-unit-test-go
description: Write a unit test for a Use Case or domain entity using the standard testing package in a Go project.
---

# Write Unit Test (Go)

## Inputs

- **Target** — the struct/function to test (e.g., `CreateUser` use case, `User` entity)

## Steps

1. Determine test file path — same package, `_test.go` suffix:
   - `internal/{module}/application/usecases/create_user.go` → `internal/{module}/application/usecases/create_user_test.go`
   - `internal/{module}/domain/entities/user.go` → `internal/{module}/domain/entities/user_test.go`

2. Structure the test:

```go
package usecases_test

import (
    "context"
    "testing"

    "internal/{module}/application/usecases"
    "tests/fakes"
)

func TestNew{UseCaseName}(t *testing.T) {
    t.Run("should {expected behavior} when {condition}", func(t *testing.T) {
        // Arrange
        repo := fakes.NewInMemory{Entity}Repository()
        sut := usecases.New{UseCaseName}(repo)
        input := usecases.{UseCaseName}Input{
            // fields
        }

        // Act
        result, err := sut.Execute(context.Background(), input)

        // Assert
        if err != nil {
            t.Fatalf("unexpected error: %v", err)
        }
        if result.Field != expected {
            t.Errorf("got %v, want %v", result.Field, expected)
        }
    })

    t.Run("should return error when {error condition}", func(t *testing.T) {
        repo := fakes.NewInMemory{Entity}Repository()
        sut := usecases.New{UseCaseName}(repo)

        _, err := sut.Execute(context.Background(), invalidInput)

        if err == nil {
            t.Fatal("expected error, got nil")
        }
    })
}
```

3. Run the test: `go test ./internal/{module}/application/usecases/... -run Test{UseCaseName} -v`
4. Confirm RED (test fails for the right reason) before implementing.

## Rules

- Use in-memory implementations of repository ports — NEVER mock the database directly.
- Use `t.Run` for subtests. Use table-driven tests for parametric scenarios.
- Test behavior, not implementation. Assert on outputs and errors.
- Use `_test` package suffix for black-box testing (test the public API).
- Cover: happy path, validation errors, edge cases, business rule violations.
- Use `context.Background()` in tests unless testing cancellation.

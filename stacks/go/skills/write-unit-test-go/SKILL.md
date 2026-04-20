---
name: write-unit-test-go
description: "Write a unit test for a Use Case or domain entity using Go's standard testing package with table-driven tests. Use when the user says 'write test', 'add tests', 'test this', 'TDD', 'cover X with tests'. Don't use for HTTP handler tests — use add-endpoint-gin for the handler, then test the use case. Don't use for integration tests with real databases."
metadata:
  skill_type: micro
  stack: go
---

# Write Unit Test (Go)

## Instructions

1. - [ ] Identify the target struct or function to test (e.g., `CreateUser` use case, `User` entity).
2. - [ ] Determine the test file path — same package, `_test.go` suffix:
   - `internal/{module}/application/usecases/create_user.go` → `create_user_test.go`
   - `internal/{module}/domain/entities/user.go` → `user_test.go`
3. - [ ] Create the test file with the `_test` package suffix for black-box testing:

```go
package usecases_test

import (
    "context"
    "testing"

    "{project}/internal/{module}/application/usecases"
    "{project}/tests/fakes"
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

4. - [ ] Run the test: `go test ./internal/{module}/application/usecases/... -run Test{UseCaseName} -v`
5. - [ ] Confirm RED (test fails for the right reason) before implementing.
6. - [ ] After implementation, verify all subtests pass.

## Critical

- Use in-memory fakes for repository ports — mocking the database directly couples tests to storage implementation and hides bugs.
- Use `_test` package suffix (e.g., `package usecases_test`) — this forces black-box testing through the public API, catching real integration issues.
- Always use `t.Run` for subtests — flat test functions with multiple assertions make failures hard to diagnose.
- Use `context.Background()` in tests unless specifically testing cancellation — production contexts add noise to unit tests.

## Examples

**User says:** "Write tests for the CancelOrder use case."

**Actions:**
1. Target: `CancelOrder` in `internal/orders/application/usecases/cancel_order.go`.
2. Create `cancel_order_test.go` with `package usecases_test`.
3. Write subtests:
   - "should cancel order when order exists and is cancellable" — arrange existing order, act cancel, assert status changed.
   - "should return error when order not found" — arrange empty repo, assert error.
   - "should return error when order already cancelled" — arrange cancelled order, assert error.
4. Run: `go test ./internal/orders/application/usecases/... -run TestCancelOrder -v`.

**Result:** 3 subtests created, all RED initially. After implementing `CancelOrder.Execute`, all pass.

## Troubleshooting

**Fake repository missing** → Test can't compile → Create an in-memory implementation of the port interface in `tests/fakes/`. It should use a `map[string]*Entity` for storage.

**Test passes but shouldn't** → Assertion is wrong → Use `t.Errorf` for soft failures (continue), `t.Fatalf` for hard failures (stop). Verify you're comparing the right fields.

**Table-driven test too verbose** → Many similar cases → Use a struct slice with `name`, `input`, `expected`, and `wantErr` fields. Loop with `t.Run(tc.name, ...)` to keep each case concise.

## See also

- `create-usecase-go` — create the use case to test
- `add-endpoint-gin` — create the HTTP endpoint that calls the use case
- `enforce-boundary` — verify test doesn't import from wrong layers
